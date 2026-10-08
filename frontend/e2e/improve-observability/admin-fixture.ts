import { test as base, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createInterface } from 'node:readline';

type AdminServer = { url: string; email: string; password: string; homeId: number };

export const test = base.extend<{}, { adminServer: AdminServer }>({
  adminServer: [async ({}, use) => {
    const backend = resolve(__dirname, '../../../backend');
    const root = mkdtempSync(join(tmpdir(), 't33-admin-'));
    const python = process.env.E2E_DJANGO_PYTHON || join(backend, 'venv/bin/python');
    const child = spawn(python, [
      '-m', 'pytest', 'core_app/tests/browser/admin_server.py',
      '-o', 'python_files=admin_server.py', '-s', '-q', '--tb=short',
    ], {
      cwd: backend,
      env: {
        ...process.env,
        DJANGO_ENV: 'development',
        DJANGO_DB_ENGINE: 'django.db.backends.sqlite3',
        DJANGO_DB_NAME: join(root, 'unused.sqlite3'),
        E2E_ADMIN_ROOT: root,
        PYTHONUNBUFFERED: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdin.on('error', () => { /* The server may exit before receiving shutdown. */ });
    child.stderr.on('data', (chunk) => { output = (output + String(chunk)).slice(-8000); });
    const lines = createInterface({ input: child.stdout });
    const exited = new Promise<void>((done) => { child.once('close', () => done()); });
    try {
      const ready = await new Promise<AdminServer>((done, fail) => {
        const timer = setTimeout(() => fail(new Error(`Admin startup timed out: ${output}`)), 120_000);
        const reject = (error: Error) => { clearTimeout(timer); fail(error); };
        child.once('error', reject);
        child.once('exit', (code) => reject(new Error(`Admin exited (${code}): ${output}`)));
        lines.on('line', (line) => {
          output = (output + '\n' + line).slice(-8000);
          if (!line.startsWith('E2E_ADMIN_READY=')) return;
          try {
            const data = JSON.parse(line.slice('E2E_ADMIN_READY='.length)) as AdminServer;
            const url = new URL(data.url);
            if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
              throw new Error('Admin fixture returned a non-loopback URL');
            }
            clearTimeout(timer);
            done(data);
          } catch (error) { reject(error as Error); }
        });
      });
      await use(ready);
    } finally {
      child.stdin.end('shutdown\n');
      let timer: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([
        exited,
        new Promise<void>((done) => { timer = setTimeout(() => { child.kill('SIGTERM'); done(); }, 10_000); }),
      ]);
      clearTimeout(timer);
      if (child.exitCode === null && child.signalCode === null) {
        const hardKill = setTimeout(() => child.kill('SIGKILL'), 5_000);
        await exited;
        clearTimeout(hardKill);
      }
      lines.close();
      rmSync(root, { recursive: true, force: true });
    }
  }, { scope: 'worker', timeout: 150_000 }],
  baseURL: async ({ adminServer }, use) => { await use(adminServer.url); },
});

export { expect };
