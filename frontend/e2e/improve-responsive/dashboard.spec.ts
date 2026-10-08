import { expect, test } from '@playwright/test';
import { FlowTags } from '../helpers/flow-tags';
import { fillLogin, jsonResponse, session, tokens, user } from './helpers';

// Bug caught: unauthenticated visitors can remain on a protected dashboard.
test('redirects an unauthenticated dashboard visit to the authentication form', {
  tag: [...FlowTags.DASHBOARD_UNAUTHENTICATED_REDIRECT, '@outcome:error'],
}, async ({ page }) => {
  await page.goto('/dashboard/');
  await expect(page).toHaveURL('/auth/login/');
  await page.getByRole('link', { name: 'Register here' }).click();
  await expect(page).toHaveURL('/auth/register/');
});

// Bug caught: the dashboard shows stale or missing profile values after login.
test('displays the signed-in profile', {
  tag: [...FlowTags.DASHBOARD_PROFILE_DISPLAY, '@outcome:display'],
}, async ({ page }) => {
  // quality: allow-deep-link (login is the entrypoint; the dashboard is reached by submitting its real authentication form)
  await page.route('**/api/auth/login/', (route) => jsonResponse(route, session));
  await page.goto('/auth/login/');
  await fillLogin(page);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL('/dashboard/');
  await expect(page.getByRole('heading', { name: 'Welcome, Ana Luz!' })).toHaveText('Welcome, Ana Luz!');
  await expect(page.getByTestId('profile-email')).toHaveText(`Email: ${user.email}`);
  await expect(page.getByTestId('profile-phone')).toHaveText(`Phone: ${user.phone}`);
  await expect(page.getByTestId('profile-status')).toHaveText('Account Status: Active');
});

// Bug caught: logout leaves cookies or a persisted profile that reopens the dashboard.
test('clears the session on logout', {
  tag: [...FlowTags.DASHBOARD_LOGOUT, '@outcome:success'],
}, async ({ page, context }) => {
  await page.route('**/api/auth/login/', (route) => jsonResponse(route, session));
  await page.goto('/auth/login/');
  await fillLogin(page);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL('/dashboard/');
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page).toHaveURL('/auth/login/');
  expect((await context.cookies()).filter(cookie => ['access_token', 'refresh_token'].includes(cookie.name))).toEqual([]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage')!).state.user)).toBeNull();
  await page.goto('/dashboard/');
  await expect(page).toHaveURL('/auth/login/');
});

// Bug caught: cookie-based recovery redirects before profile initialization completes.
test('restores the dashboard after a profile-free reload', {
  tag: [...FlowTags.AUTH_LOGIN, '@outcome:success'],
}, async ({ page }) => {
  await page.route('**/api/auth/login/', (route) => jsonResponse(route, session));
  await page.goto('/auth/login/');
  await fillLogin(page);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL('/dashboard/');
  await page.evaluate(() => localStorage.removeItem('auth-storage'));
  await page.route('**/api/auth/profile/', (route) => jsonResponse(route, { user }));
  const request = page.waitForRequest('**/api/auth/profile/');
  await page.reload();
  expect((await request).headers().authorization).toBe(`Bearer ${tokens.access}`);
  await expect(page.getByRole('heading', { name: 'Welcome, Ana Luz!' })).toHaveText('Welcome, Ana Luz!');
  await expect(page).toHaveURL('/dashboard/');
});
