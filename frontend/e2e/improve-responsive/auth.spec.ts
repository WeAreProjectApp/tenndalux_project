import { expect, test } from '@playwright/test';
import { FlowTags } from '../helpers/flow-tags';
import { viewportUse, type ViewportAlias } from '../helpers/viewports';
import { credentials, fillLogin, fillRegistration, jsonResponse, session, tokens, user, expectTouchTarget, expectNoDocumentOverflow } from './helpers';

for (const alias of ['compact', 'portrait', 'landscape', 'desktop', 'wide'] as ViewportAlias[]) {
  test.describe(`login @ ${alias}`, () => {
    test.use(viewportUse(alias));
    // Bug caught: login fails to establish a usable session at the reference viewport.
    test('reaches the dashboard after login', {
      tag: [...FlowTags.AUTH_LOGIN, '@outcome:success', `@viewport:${alias}`],
    }, async ({ page, context }) => {
      // quality: allow-duplicate (per-viewport contract: auth-login @ canonical reference viewport)
      await page.route('**/api/auth/login/', (route) => jsonResponse(route, session));
      await page.goto('/auth/login/');
      await fillLogin(page);
      expect(await page.getByRole('textbox', { name: 'Email', exact: true }).evaluate(input => {
        const box = input.getBoundingClientRect();
        return { touch: box.height >= 44 && box.width >= 44, font: parseFloat(getComputedStyle(input).fontSize) >= 16 };
      })).toEqual({ touch: true, font: true });
      await expectNoDocumentOverflow(page);
      const request = page.waitForRequest('**/api/auth/login/');
      await page.getByRole('button', { name: 'Login', exact: true }).click();
      expect((await request).postDataJSON()).toEqual(credentials);
      await expect(page).toHaveURL('/dashboard/');
      await expect(page.getByRole('heading', { name: 'Welcome, Ana Luz!' })).toHaveText('Welcome, Ana Luz!');
      const cookies = await context.cookies();
      expect(cookies.find(cookie => cookie.name === 'access_token')?.value).toBe(tokens.access);
      expect(cookies.find(cookie => cookie.name === 'refresh_token')?.value).toBe(tokens.refresh);
    });
  });
}

// Bug caught: invalid credentials lose the concrete server validation message.
test('explains rejected login credentials', {
  tag: [...FlowTags.AUTH_LOGIN, '@outcome:error'],
}, async ({ page }) => {
  await page.route('**/api/auth/login/', (route) => jsonResponse(route, { error: 'Login failed', details: { non_field_errors: ['Invalid email or password'] } }, 400));
  await page.goto('/auth/login/');
  await fillLogin(page);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Invalid email or password' })).toHaveText('Invalid email or password');
  await expect(page).toHaveURL('/auth/login/');
});

// Bug caught: a transport failure leaves the login disabled or erases its fields.
test('retries login after a transport failure', {
  tag: [...FlowTags.AUTH_LOGIN, '@outcome:failure'],
}, async ({ page }) => {
  await page.route('**/api/auth/login/', (route) => route.abort());
  await page.goto('/auth/login/');
  await fillLogin(page);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Login failed' })).toHaveText('Login failed');
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(credentials.email);
  await page.route('**/api/auth/login/', (route) => jsonResponse(route, session));
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL('/dashboard/');
});

for (const alias of ['compact', 'portrait', 'landscape', 'desktop', 'wide'] as ViewportAlias[]) {
  test.describe(`registration @ ${alias}`, () => {
    test.use(viewportUse(alias));
    // Bug caught: register inputs or submit become unusable at the reference viewport.
    test('creates the account through the registration form', {
      tag: [...FlowTags.AUTH_REGISTER, '@outcome:success', `@viewport:${alias}`],
    }, async ({ page }) => {
      // quality: allow-duplicate (per-viewport contract: auth-register @ canonical reference viewport)
      await page.route('**/api/auth/register/', (route) => jsonResponse(route, { ...session, message: 'User registered successfully' }, 201));
      await page.goto('/auth/login/');
      await page.getByRole('link', { name: 'Register here' }).click();
      await fillRegistration(page);
      await expectTouchTarget(page.getByRole('button', { name: 'Register', exact: true }));
      await expectTouchTarget(page.getByLabel('First Name'));
      await expectNoDocumentOverflow(page);
      const request = page.waitForRequest('**/api/auth/register/');
      await page.getByRole('button', { name: 'Register', exact: true }).click();
      expect((await request).postDataJSON()).toEqual({ ...credentials, password_confirm: credentials.password, first_name: user.first_name, last_name: user.last_name, phone: user.phone });
      await expect(page).toHaveURL('/dashboard/');
      await expect(page.getByRole('heading', { name: 'Welcome, Ana Luz!' })).toHaveText('Welcome, Ana Luz!');
    });
  });
}

for (const rejection of [
  { field: 'email', message: 'A user with this email already exists.', password: credentials.password, confirmation: credentials.password },
  { field: 'password_confirm', message: 'Passwords do not match', password: credentials.password, confirmation: 'DifferentPassword17!' },
  { field: 'password', message: 'This password is too common.', password: 'password123', confirmation: 'password123' },
]) {
  // Bug caught: only email errors are surfaced, hiding password validation details.
  test(`explains registration rejection for ${rejection.field}`, {
    tag: [...FlowTags.AUTH_REGISTER, '@outcome:error'],
  }, async ({ page }) => {
    await page.route('**/api/auth/register/', (route) => jsonResponse(route, { error: 'Registration failed', details: { [rejection.field]: [rejection.message] } }, 400));
    await page.goto('/auth/login/');
    await page.getByRole('link', { name: 'Register here' }).click();
    await fillRegistration(page);
    await page.getByLabel('Password *', { exact: true }).fill(rejection.password);
    await page.getByLabel('Confirm Password *', { exact: true }).fill(rejection.confirmation);
    await page.getByRole('button', { name: 'Register', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: rejection.message })).toHaveText(rejection.message);
    await expect(page).toHaveURL('/auth/register/');
  });
}

// Bug caught: failed registration cannot be resubmitted with the retained personal data.
test('retries registration after a transport failure', {
  tag: [...FlowTags.AUTH_REGISTER, '@outcome:failure'],
}, async ({ page }) => {
  await page.route('**/api/auth/register/', (route) => route.abort());
  await page.goto('/auth/login/');
  await page.getByRole('link', { name: 'Register here' }).click();
  await fillRegistration(page);
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Registration failed' })).toHaveText('Registration failed');
  await expect(page.getByLabel('First Name')).toHaveValue('Ana');
  await page.route('**/api/auth/register/', (route) => jsonResponse(route, session, 201));
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(page).toHaveURL('/dashboard/');
});
