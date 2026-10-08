import { test, expect, type Page } from '@playwright/test';
import { FlowTags } from '../helpers/flow-tags';

const post = {
  id: 1, slug: '_shell', title: 'Artículo de prueba publicado', excerpt: 'Consejos de decoración',
  tags: [], content_blocks: [{ type: 'parrafo', text: 'Texto real del artículo de prueba.' }],
  published_at: null, created_at: '2026-01-01T12:00:00Z', meta_title: 'Título editorial',
  cover_image_url: null, read_time_minutes: 2,
};
const project = {
  id: 1, slug: '_shell', title: 'Proyecto de prueba publicado', description: 'Una sala luminosa',
  categories: [], styles: [], year: 2026, location: 'Bogotá', cover_image_url: null,
  content_blocks: [{ type: 'parrafo', text: 'Texto real del proyecto de prueba.' }],
};

async function isolate(page: Page) {
  await page.route('**/api/**', (route) => route.fulfill({ json: {} }));
  await page.route('**/api/blog/posts/', (route) => route.fulfill({ json: { results: [] } }));
  await page.route('**/api/portfolio/projects/', (route) => route.fulfill({ json: { results: [] } }));
}

type DetailFixture = {
  path: string;
  endpoint: string;
  item: typeof post | typeof project;
  noun: string;
};
const blog: DetailFixture = { path: 'blog', endpoint: 'blog/posts', item: post, noun: 'artículo' };
const portfolio: DetailFixture = { path: 'portafolio', endpoint: 'portfolio/projects', item: project, noun: 'proyecto' };

async function openPublishedCard(page: Page, domain: DetailFixture) {
  await isolate(page);
  await page.route(`**/api/${domain.endpoint}/`, (route) => route.fulfill({ json: { results: [domain.item] } }));
  await page.route(`**/api/${domain.endpoint}/_shell/`, (route) => route.fulfill({ json: domain.item }));
  await page.goto(`/${domain.path}`);
  await page.getByRole('link', { name: new RegExp(domain.item.title) }).filter({ visible: true }).first().click();
  await page.waitForURL(new RegExp(`/${domain.path}/_shell/?$`));
  await expect(page.getByRole('heading', { name: domain.item.title, level: 1 })).toBeVisible();
  await expect(page.getByText(domain.item.content_blocks[0].text)).toBeVisible();
}

async function returnFromMissing(page: Page, domain: DetailFixture) {
  await isolate(page);
  await page.route(`**/api/${domain.endpoint}/_shell/`, (route) => route.fulfill({ status: 404, json: {} }));
  await page.goto(`/${domain.path}/_shell`);
  await page.getByRole('link', { name: /Ver todos los/ }).click();
}

async function retryDetail(page: Page, domain: DetailFixture, failure: string) {
  await isolate(page);
  const endpoint = `**/api/${domain.endpoint}/_shell/`;
  await page.route(endpoint, (route) => failure === 'network'
    ? route.abort('failed') : route.fulfill({ status: 503, json: {} }));
  await page.goto(`/${domain.path}/_shell`);
  await expect(page.getByRole('heading', { name: `No pudimos cargar este ${domain.noun}` })).toBeVisible();
  await page.unroute(endpoint);
  await page.route(endpoint, (route) => route.fulfill({ json: domain.item }));
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('alert').filter({ hasText: `No pudimos cargar este ${domain.noun}` })).toHaveCount(0);
}

test('blog opens published detail from a card', {
  tag: [...FlowTags.PUBLIC_BLOG_DETAIL, '@outcome:display'],
}, async ({ page }) => {
  await openPublishedCard(page, blog);
  await expect(page).toHaveTitle(post.meta_title);
});

test('portafolio opens published detail from a card', {
  tag: [...FlowTags.PUBLIC_PORTFOLIO_DETAIL, '@outcome:display'],
}, async ({ page }) => {
  await openPublishedCard(page, portfolio);
  await expect(page).toHaveTitle('Proyecto de prueba publicado — Tenndalux');
});

test('blog offers a return link for HTTP 404', {
  tag: [...FlowTags.PUBLIC_BLOG_DETAIL, '@outcome:failure'],
}, async ({ page }) => {
  await returnFromMissing(page, blog);
  await expect(page).toHaveURL(/\/blog\/?$/);
});

test('portafolio offers a return link for HTTP 404', {
  tag: [...FlowTags.PUBLIC_PORTFOLIO_DETAIL, '@outcome:failure'],
}, async ({ page }) => {
  await returnFromMissing(page, portfolio);
  await expect(page).toHaveURL(/\/portafolio\/?$/);
});

for (const failure of ['503', 'network']) {
  test(`blog retries after ${failure}`, {
    tag: [...FlowTags.PUBLIC_BLOG_DETAIL, '@outcome:failure'],
  }, async ({ page }) => {
    await retryDetail(page, blog, failure);
    await expect(page.getByRole('heading', { name: post.title, level: 1 })).toBeVisible();
  });
  test(`portafolio retries after ${failure}`, {
    tag: [...FlowTags.PUBLIC_PORTFOLIO_DETAIL, '@outcome:failure'],
  }, async ({ page }) => {
    await retryDetail(page, portfolio, failure);
    await expect(page.getByRole('heading', { name: project.title, level: 1 })).toBeVisible();
  });
}

for (const integration of ['native', 'clipboard']) {
  for (const rejects of integration === 'native' ? [false, true] : [true]) {
    test(`blog ${integration} share ${rejects ? 'rejection' : 'success'}`, {
      tag: [...FlowTags.PUBLIC_BLOG_SHARE, rejects ? '@outcome:failure' : '@outcome:success'],
    }, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.addInitScript(({ integration, rejects }) => {
        const calls: unknown[] = [];
        Object.assign(window, { shareCalls: calls, unhandledShares: [] });
        window.addEventListener('unhandledrejection', (event) => {
          (window as unknown as { unhandledShares: string[] }).unhandledShares.push(String(event.reason));
        });
        const share = async (payload: unknown) => {
          calls.push(payload);
          if (rejects) throw new DOMException('Denied by browser', 'NotAllowedError');
        };
        Object.defineProperty(navigator, 'share', { configurable: true, value: integration === 'native' ? share : undefined });
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: share } });
      }, { integration, rejects });
      await isolate(page);
      await page.route('**/api/blog/posts/_shell/', (route) => route.fulfill({ json: post }));
      await page.goto('/blog/_shell');
      await expect(page.getByRole('heading', { name: post.title, level: 1 })).toBeVisible();

      await page.getByRole('button', { name: 'Compartir' }).click();

      await expect.poll(() => page.evaluate(() => (window as unknown as { shareCalls: unknown[] }).shareCalls.length)).toBe(1);
      const calls = await page.evaluate(() => (window as unknown as { shareCalls: unknown[] }).shareCalls);
      expect(calls[0]).toEqual(integration === 'native' ? { title: post.title, url: page.url() } : page.url());
      expect(await page.evaluate(() => (window as unknown as { unhandledShares: string[] }).unhandledShares)).toEqual([]);
      await page.getByRole('link', { name: 'Volver al Blog' }).click();
      await page.waitForURL(/\/blog\/?$/);
      await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
}

test('blog copies its URL to the real browser clipboard', {
  tag: [...FlowTags.PUBLIC_BLOG_SHARE, '@outcome:success'],
}, async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
  });
  await isolate(page);
  await page.route('**/api/blog/posts/_shell/', (route) => route.fulfill({ json: post }));
  await page.goto('/blog/_shell');
  await expect(page.getByRole('heading', { name: post.title, level: 1 })).toBeVisible();

  await page.getByRole('button', { name: 'Compartir' }).click();

  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
});
