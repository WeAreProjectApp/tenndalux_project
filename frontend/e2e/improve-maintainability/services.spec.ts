import { expect, test } from '@playwright/test';
import { FlowTags, RoleTags } from '../helpers/flow-tags';
import { blogPosts, routeCatalogue } from './catalogue-fixtures';
import { VIEWPORTS, viewportUse, type ViewportAlias } from '../helpers/viewports';

async function expectPageScroll(page: import('@playwright/test').Page) {
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.move(200, 300);
  await page.mouse.wheel(0, before > 0 ? -400 : 400);
  await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(before);
}

test.beforeEach(async ({ page }) => {
  await routeCatalogue(page, '/blog/posts/', [blogPosts[0]]);
  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Portada de diseño', exact: true })).toHaveText('Portada de diseño');
});

// Bug caught: navigation to Services omits the initial published curtain solution.
test('visitor reads the initial curtain solution after navigating to Services', {
  tag: [...FlowTags.PUBLIC_SERVICES_DISPLAY, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }).click();
  await expect(page).toHaveURL(/\/servicios\/$/);
  await expect(page.getByRole('heading', { name: 'Cortina Ondessence', exact: true })).toHaveText('Cortina Ondessence');
  await expect(page.getByText('Ondas técnicas uniformes', { exact: true })).toHaveText('Ondas técnicas uniformes');
  await expect(page.getByRole('button', { name: 'Cortinas', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

// Bug caught: switching solution tabs fails to replace their specific content.
test('visitor switches the available service solutions', {
  tag: [...FlowTags.PUBLIC_SERVICES_TAB, RoleTags.GUEST, '@outcome:success'],
}, async ({ page }) => {
  await page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }).click();
  await expect(page).toHaveURL(/\/servicios\/$/);

  await page.getByRole('button', { name: 'Recubrimientos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recubrimientos para Paredes', exact: true })).toHaveText('Recubrimientos para Paredes');
  await page.getByRole('button', { name: 'Exteriores', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Toldos', exact: true })).toHaveText('Toldos');
  await page.getByRole('button', { name: 'Tecnología', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Automatización Inteligente', exact: true })).toHaveText('Automatización Inteligente');
  await page.getByRole('button', { name: 'Cortinas', exact: true }).click();
  await page.getByRole('button', { name: 'Luminux', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Luminux', exact: true })).toHaveText('Luminux');
});

// Bug caught: the compact exterior card opens details for an unrelated solution.
test('visitor reads the compact Toldos solution details', {
  tag: [...FlowTags.PUBLIC_SERVICES_EXTERIOR_MOBILE_DETAIL, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.compact);
  await page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }).click();
  await expect(page).toHaveURL(/\/servicios\/$/);
  await page.getByRole('button', { name: 'Exteriores', exact: true }).click();

  await page.getByRole('button', { name: 'Toldos', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'Toldos', exact: true });
  await expect(dialog.getByRole('heading', { name: 'Toldos', exact: true })).toHaveText('Toldos');
  await expect(dialog).toContainText('Sistema Cofrex con cofre protector (hasta 6 m x 3 m)');
  await expect(dialog.getByRole('link', { name: 'Cotizar Toldos', exact: true })).toHaveAttribute('href', /wa\.me\/.*Toldos/);
});

// Bug caught: closing the compact bottom sheet leaves scrolling locked.
test('visitor closes the compact exterior bottom sheet through its backdrop', {
  tag: [...FlowTags.PUBLIC_SERVICES_EXTERIOR_MOBILE_DETAIL, RoleTags.GUEST, '@outcome:success'],
}, async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.compact);
  await page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }).click();
  await expect(page).toHaveURL(/\/servicios\/$/);
  await page.getByRole('button', { name: 'Exteriores', exact: true }).click();
  await page.getByRole('button', { name: 'Toldos', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Toldos', exact: true })).toContainText('Sistema Cofrex');
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

  await page.getByRole('button', { name: 'Cerrar detalles', exact: true }).click({ position: { x: 10, y: 100 } });

  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await page.getByRole('button', { name: 'Recubrimientos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recubrimientos para Paredes', exact: true })).toHaveText('Recubrimientos para Paredes');
});

// Bug caught: larger viewports receive hidden compact details instead of full exterior cards.
for (const alias of ['portrait', 'landscape', 'desktop', 'wide'] as ViewportAlias[]) {
  test.describe(`exterior cards @ ${alias}`, () => {
    test.use(viewportUse(alias));
    test('visitor reads the full exterior solution cards', {
      tag: [...FlowTags.PUBLIC_SERVICES_TAB, RoleTags.GUEST, '@outcome:success', `@viewport:${alias}`],
    }, async ({ page }) => {
      // quality: allow-duplicate (per-viewport contract: public-services-tab @ canonical reference viewport)
      await page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }).click();
      await expect(page).toHaveURL(/\/servicios\/$/);
      await page.getByRole('button', { name: 'Exteriores', exact: true }).click();

      await expect(page.getByRole('heading', { name: 'Toldos', exact: true })).toHaveText('Toldos');
      await expect(page.getByRole('heading', { name: 'Pérgolas', exact: true })).toHaveText('Pérgolas');
      await expect(page.getByText('Sistema Cofrex con cofre protector (hasta 6 m x 3 m)', { exact: true })).toHaveText('Sistema Cofrex con cofre protector (hasta 6 m x 3 m)');
      await expect(page.getByRole('button', { name: 'Toldos', exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  });
}

test.describe('exterior detail lifecycle @ compact', () => {
  test.use(viewportUse('compact'));

  // Bug caught: sm:hidden removes the open sheet while its global scroll lock persists.
  test('visitor resumes browsing after the exterior sheet crosses its breakpoint', {
    tag: [...FlowTags.PUBLIC_SERVICES_EXTERIOR_MOBILE_DETAIL, RoleTags.GUEST, '@outcome:success', '@viewport:compact', '@viewport:portrait'],
  }, async ({ page }) => {
    await page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }).click();
    await page.getByRole('button', { name: 'Exteriores', exact: true }).click();
    const previousOverflow = await page.evaluate(() => document.body.style.overflow);
    await page.getByRole('button', { name: 'Toldos', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Toldos', exact: true });
    await expect(dialog).toContainText('Sistema Cofrex con cofre protector (hasta 6 m x 3 m)');

    // Resizing is the interaction under test, after the compact sheet is open.
    await page.setViewportSize(VIEWPORTS.portrait);
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(previousOverflow);
    await expectPageScroll(page);
    await expect(page.getByText('Sistema Cofrex con cofre protector (hasta 6 m x 3 m)', { exact: true })).toBeVisible();

    await page.setViewportSize(VIEWPORTS.compact);
    await expect(dialog).toHaveCount(0);
    await page.getByRole('button', { name: 'Toldos', exact: true }).click();
    await expect(dialog).toContainText('Sistema Cofrex');
    await page.getByRole('button', { name: 'Cerrar detalles', exact: true }).click({ position: { x: 10, y: 100 } });
    await expect(dialog).toHaveCount(0);
  });

  // Bug caught: history navigation unmounts the sheet without restoring document scrolling.
  test('visitor scrolls Blog after leaving an open exterior sheet', {
    tag: [...FlowTags.PUBLIC_SERVICES_EXTERIOR_MOBILE_DETAIL, RoleTags.GUEST, '@outcome:success', '@viewport:compact'],
  }, async ({ page }) => {
    await page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }).click();
    await page.getByRole('button', { name: 'Exteriores', exact: true }).click();
    const previousOverflow = await page.evaluate(() => document.body.style.overflow);
    await page.getByRole('button', { name: 'Toldos', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Toldos', exact: true })).toContainText('Sistema Cofrex');
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

    await page.goBack();
    await expect(page).toHaveURL(/\/blog\/$/);
    await expect(page.getByRole('heading', { name: 'Portada de diseño', exact: true })).toHaveText('Portada de diseño');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(previousOverflow);
    await expectPageScroll(page);
  });
});
