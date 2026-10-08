import { expect, test } from '@playwright/test';
import { FlowTags } from '../helpers/flow-tags';
import { viewportUse, VIEWPORTS } from '../helpers/viewports';
import { expectNoDocumentOverflow, expectTouchTarget, isolatePublicApi } from './helpers';

for (const alias of ['compact', 'portrait'] as const) {
  test.describe(`overlay navigation @ ${alias}`, () => {
    test.use(viewportUse(alias));
    // Bug caught: portrait navigation incorrectly uses desktop links or the overlay loses destinations.
    test('opens the public destination through the overlay', {
      tag: [...FlowTags.PUBLIC_HEADER_NAVIGATION, '@outcome:success', `@viewport:${alias}`],
    }, async ({ page }) => {
      // quality: allow-duplicate (per-viewport contract: public-header-navigation @ compact and portrait)
      await isolatePublicApi(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const trigger = page.getByRole('button', { name: 'Toggle menu' });
      await expectTouchTarget(trigger);
      await trigger.click();
      const menu = page.getByRole('dialog', { name: 'Navegación principal' });
      await expect(menu.getByRole('link')).toHaveText(['', 'Inicio', 'Servicios', 'Portafolio', 'Blog', 'Contáctanos', 'Instagram', 'Facebook']);
      await expectTouchTarget(menu.getByRole('button', { name: 'Close menu' }));
      await expectNoDocumentOverflow(page);
      await menu.getByRole('link', { name: 'Servicios', exact: true }).click();
      await page.waitForURL('/servicios/', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL('/servicios/');
      await expect(page.getByRole('heading', { name: 'Productos y Soluciones', exact: true, level: 1 })).toHaveText('Productos y Soluciones');
      await expect(menu).toBeHidden();
    });

    for (const dismissal of ['button', 'Escape', 'background'] as const) {
      // Bug caught: dismissing the menu leaves scroll locked or loses keyboard focus.
      test(`dismisses the overlay with ${dismissal}`, {
        tag: [...FlowTags.PUBLIC_HEADER_NAVIGATION, '@outcome:success', `@viewport:${alias}`],
      }, async ({ page }) => {
        // quality: allow-duplicate (per-viewport contract: menu dismissal @ compact and portrait)
        await isolatePublicApi(page);
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const trigger = page.getByRole('button', { name: 'Toggle menu' });
        await trigger.click();
        const menu = page.getByRole('dialog', { name: 'Navegación principal' });
        await expect(menu.getByRole('button', { name: 'Close menu' })).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(menu.getByRole('link', { name: 'Inicio', exact: true })).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Shift+Tab');
        await expect(menu.getByRole('link', { name: 'Facebook' })).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(menu.getByTestId('mobile-menu-logo-link')).toBeFocused();
        await dismissMenu(page, dismissal);
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(trigger).toBeFocused();
        expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
      });
    }
  });
}

async function dismissMenu(page: import('@playwright/test').Page, dismissal: string) {
  if (dismissal === 'button') await page.getByRole('button', { name: 'Close menu' }).click();
  else if (dismissal === 'Escape') await page.keyboard.press('Escape');
  else await page.getByRole('dialog').click({ position: { x: 8, y: 140 } });
}

for (const alias of ['landscape', 'desktop', 'wide'] as const) {
  test.describe(`desktop navigation @ ${alias}`, () => {
    test.use(viewportUse(alias));
    // Bug caught: the breakpoint change hides desktop routes or introduces horizontal overflow.
    test('reaches services from the desktop navigation', {
      tag: [...FlowTags.PUBLIC_HEADER_NAVIGATION, '@outcome:success', `@viewport:${alias}`],
    }, async ({ page }) => {
      // quality: allow-duplicate (per-viewport contract: public-header-navigation @ desktop widths)
      await isolatePublicApi(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const services = page.getByRole('banner').getByRole('link', { name: 'Servicios', exact: true });
      await expectTouchTarget(services);
      await services.click();
      await page.waitForURL('/servicios/', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL('/servicios/');
      await expect(page.getByRole('heading', { name: 'Productos y Soluciones', level: 1 })).toHaveText('Productos y Soluciones');
      await expect(page.getByRole('button', { name: 'Toggle menu' })).toBeHidden();
      await expectNoDocumentOverflow(page);
    });
  });
}

test.describe('navigation after rotating the tablet', () => {
  test.use(viewportUse('portrait'));
  // Bug caught: a hidden menu leaves desktop navigation inert after a resize.
  test('closes the overlay when desktop navigation becomes available', {
    tag: [...FlowTags.PUBLIC_HEADER_NAVIGATION, '@outcome:success'],
  }, async ({ page }) => {
    await isolatePublicApi(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.setViewportSize(VIEWPORTS.landscape);
    await expect(page.getByRole('dialog')).toBeHidden();
    await page.getByRole('banner').getByRole('link', { name: 'Servicios', exact: true }).click();
    await page.waitForURL('/servicios/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL('/servicios/');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });
});
