import { test, expect } from '@playwright/test';
import { FlowTags } from '../helpers/flow-tags';

test('FAQ collapses the selected answer', {
  tag: [...FlowTags.PUBLIC_FAQ_TOGGLE, '@outcome:success'],
}, async ({ page }) => {
  await page.route('**/api/**', (route) => route.fulfill({ json: {} }));
  await page.goto('/');
  const question = page.getByRole('button', { name: '¿Cuánto tiempo tarda la fabricación e instalación?' });
  await expect(question).toHaveAttribute('aria-expanded', 'true');

  await question.click();

  await expect(question).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('region', { name: '¿Cuánto tiempo tarda la fabricación e instalación?' })).toHaveCount(0);
});

test('FAQ displays the selected answer', {
  tag: [...FlowTags.PUBLIC_FAQ_TOGGLE, '@outcome:display'],
}, async ({ page }) => {
  await page.route('**/api/**', (route) => route.fulfill({ json: {} }));
  await page.goto('/');
  const question = page.getByRole('button', { name: '¿Qué garantía ofrecen?' });

  await question.click();

  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('region', { name: '¿Qué garantía ofrecen?' })).toContainText('Ofrecemos hasta 5 años de garantía');
  await expect(page.getByRole('button', { name: '¿Cuánto tiempo tarda la fabricación e instalación?' })).toHaveAttribute('aria-expanded', 'false');
});
