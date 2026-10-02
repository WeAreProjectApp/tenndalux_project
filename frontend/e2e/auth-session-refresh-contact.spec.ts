import { test, expect, type BrowserContext, type Page } from '@playwright/test';

const LOCAL_ORIGIN = 'http://localhost:3000/';

const contactPayload = {
  full_name: 'Ana Pérez',
  email: 'ana.perez@example.com',
  phone: '+57 300 123 4567',
  message: 'Me interesa: Luminux',
  source: 'formulario-home',
};

async function seedStaleSession(context: BrowserContext) {
  await context.addCookies([
    { name: 'access_token', value: 'a0', url: LOCAL_ORIGIN },
    { name: 'refresh_token', value: 'r0', url: LOCAL_ORIGIN },
  ]);
}

async function fillContactForm(page: Page) {
  await page.getByLabel('Nombre').fill('Ana');
  await page.getByLabel('Apellido').fill('Pérez');
  await page.getByLabel('Email').fill('ana.perez@example.com');
  await page.getByLabel('Teléfono').fill('+57 300 123 4567');
  await page.getByLabel('Me interesa').selectOption('luminux');
}

async function visitContactForm(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Contáctanos', exact: true }).click();
  await expect(page.getByLabel('Nombre')).toBeEditable();
}

// Bug caught: a successful replay used to keep the old refresh token, so the next expiry logged out a visitor who had already submitted once.
test('contact submission rotates both tokens across two expired sessions', {
  tag: ['@flow:auth-session-refresh-contact', '@outcome:success'],
}, async ({ page, context }) => {
  const leadAttempts: Array<{ authorization: string | undefined; payload: unknown }> = [];
  const refreshBodies: string[] = [];
  let refreshCount = 0;

  await page.route('**/api/leads/leads/', async (route) => {
    leadAttempts.push({
      authorization: route.request().headers().authorization,
      payload: route.request().postDataJSON(),
    });

    if (leadAttempts.length === 1 || leadAttempts.length === 3) {
      await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
      return;
    }

    await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/api/auth/token/refresh/', async (route) => {
    const body = route.request().postDataJSON() as { refresh: string };
    refreshBodies.push(body.refresh);
    refreshCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        refreshCount === 1
          ? { access: 'a1', refresh: 'r1' }
          : { access: 'a2', refresh: 'r2' },
      ),
    });
  });

  await seedStaleSession(context);
  await visitContactForm(page);

  await fillContactForm(page);
  await page.getByRole('button', { name: 'Enviar Solicitud' }).click();
  await expect(page.getByRole('dialog')).toHaveText(/¡Solicitud enviada!/);
  await page.getByRole('button', { name: 'Cerrar' }).click();

  await fillContactForm(page);
  await page.getByRole('button', { name: 'Enviar Solicitud' }).click();
  await expect(page.getByRole('dialog')).toHaveText(/¡Solicitud enviada!/);

  expect(leadAttempts).toEqual([
    { authorization: 'Bearer a0', payload: contactPayload },
    { authorization: 'Bearer a1', payload: contactPayload },
    { authorization: 'Bearer a1', payload: contactPayload },
    { authorization: 'Bearer a2', payload: contactPayload },
  ]);
  expect(refreshBodies).toEqual(['r0', 'r1']);
  expect(
    (await context.cookies(LOCAL_ORIGIN))
      .filter(({ name }) => name === 'access_token' || name === 'refresh_token')
      .map(({ name, value }) => ({ name, value })),
  ).toEqual([
    { name: 'access_token', value: 'a2' },
    { name: 'refresh_token', value: 'r2' },
  ]);
});

// Bug caught: a rejected refresh used to strand the visitor on the form with stale credentials still stored in the browser.
test('rejected refresh clears session cookies and sends the contact visitor to login', {
  tag: ['@flow:auth-session-refresh-contact', '@outcome:failure'],
}, async ({ page, context }) => {
  await page.route('**/api/leads/leads/', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/api/auth/token/refresh/', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
  });

  await seedStaleSession(context);
  await visitContactForm(page);
  await fillContactForm(page);
  await page.getByRole('button', { name: 'Enviar Solicitud' }).click();

  await expect(page).toHaveURL('http://localhost:3000/auth/login/');
  expect(
    (await context.cookies(LOCAL_ORIGIN))
      .filter(({ name }) => name === 'access_token' || name === 'refresh_token'),
  ).toEqual([]);
});
