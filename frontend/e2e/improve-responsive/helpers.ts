import { expect, type Locator, type Page, type Route } from '@playwright/test';

export const user = {
  id: 11, email: 'viewer@example.test', first_name: 'Ana', last_name: 'Luz',
  full_name: 'Ana Luz', phone: '3001234567', avatar: null, role: 'viewer',
  is_active: true, date_joined: '2026-01-02T12:00:00Z', last_login: null,
};
export const credentials = { email: user.email, password: 'LocalPassword17!' };
export const tokens = { access: 't11-access-fixture', refresh: 't11-refresh-fixture' };
export const session = { user, tokens, message: 'Login successful' };

export function jsonResponse(route: Route, data: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
}

export async function isolatePublicApi(page: Page) {
  await page.route('**/api/**', (route) => jsonResponse(route, {}));
  await page.route('https://apis.google.com/**', (route) => route.abort());
  await page.route('https://www.gstatic.com/**', (route) => route.abort());
}

export async function fillLogin(page: Page) {
  await page.getByLabel('Email', { exact: true }).fill(credentials.email);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
}

export async function fillRegistration(page: Page) {
  await page.getByLabel('Email *', { exact: true }).fill(credentials.email);
  await page.getByLabel('First Name').fill(user.first_name);
  await page.getByLabel('Last Name').fill(user.last_name);
  await page.getByLabel('Phone').fill(user.phone);
  await page.getByLabel('Password *', { exact: true }).fill(credentials.password);
  await page.getByLabel('Confirm Password *', { exact: true }).fill(credentials.password);
}

export async function loginThroughUi(page: Page) {
  await page.route('**/api/auth/login/', (route) => jsonResponse(route, session));
  await page.goto('/auth/login/');
  await fillLogin(page);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL('/dashboard/');
}

export async function reachHomeThroughUi(page: Page) {
  await isolatePublicApi(page);
  await page.goto('/servicios/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('banner').getByRole('link', { name: 'Tenndalux', exact: true }).click();
  await page.waitForURL('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL('/');
}

export async function expectTouchTarget(control: Locator) {
  const box = (await control.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
}

export async function expectNoDocumentOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
