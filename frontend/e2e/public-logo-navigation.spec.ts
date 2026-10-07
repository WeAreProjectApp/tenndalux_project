import { expect, test, type Locator, type Page } from '@playwright/test';
import { FlowTags } from './helpers/flow-tags';
import { viewportUse, type ViewportAlias } from './helpers/viewports';

const LOGO_PATH = '/logo-tenndalux.webp';
const LOGO_WIDTH = 5760;
const LOGO_HEIGHT = 3240;
const MAX_LOGO_BYTES = 200_000;
const viewportScenarios: { alias: ViewportAlias; headerHeight: number }[] = [
  { alias: 'compact', headerHeight: 80 },
  { alias: 'portrait', headerHeight: 96 },
  { alias: 'landscape', headerHeight: 96 },
  { alias: 'desktop', headerHeight: 96 },
  { alias: 'wide', headerHeight: 96 },
];

async function isolateHomeApi(page: Page) {
  await page.route('**/api/site/home/', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ hero_image_url: null }),
  }));
}

async function expectDecodedLogo(image: Locator, expectedHeight: number) {
  await expect(image).toHaveAttribute('src', LOGO_PATH);
  await expect(image).toHaveJSProperty('naturalWidth', LOGO_WIDTH);
  await expect(image).toHaveJSProperty('naturalHeight', LOGO_HEIGHT);
  await expect.poll(async () => image.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return {
      height: Math.round(box.height),
      aspectWithinOnePixel: Math.abs(box.width - (box.height * 16 / 9)) <= 1,
    };
  })).toEqual({ height: expectedHeight, aspectWithinOnePixel: true });
}

async function openServicesWithLogo(page: Page) {
  await isolateHomeApi(page);
  const logoResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === LOGO_PATH && response.request().resourceType() === 'image';
  });

  await page.goto('/servicios/', { waitUntil: 'commit' });
  return logoResponse;
}

for (const scenario of viewportScenarios) {
  test.describe(`public logo navigation at ${scenario.alias}`, { tag: `@viewport:${scenario.alias}` }, () => {
    test.use(viewportUse(scenario.alias));

    // Bug caught: the WebP logo is absent, distorted at a responsive width, exceeds its byte budget, or no longer navigates to the landing page.
    test('uses the decoded brand logo to navigate between public pages', {
      tag: [...FlowTags.PUBLIC_HEADER_NAVIGATION, '@outcome:success'],
    }, async ({ page }) => {
      // quality: allow-duplicate (per-viewport contract: public-header-navigation @ canonical viewport)
      const response = await openServicesWithLogo(page);
      const header = page.getByRole('banner');
      const headerLogo = header.getByRole('link', { name: 'Tenndalux', exact: true });
      const headerImage = headerLogo.getByAltText('Tenndalux', { exact: true });

      await expectDecodedLogo(headerImage, scenario.headerHeight);
      const logoResponse = await response;
      const logoBytes = (await logoResponse.body()).byteLength;
      expect(logoResponse.status()).toBe(200);
      expect(logoResponse.headers()['content-type']).toMatch(/^image\/webp(?:;|$)/i);
      expect(logoBytes).toBeLessThanOrEqual(MAX_LOGO_BYTES);

      await headerLogo.click();
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { name: /Tu espacio no solo se estrena\. Se diseña\./ }))
        .toHaveText(/Tu espacio no solo\s*se estrena\.\s*Se diseña\./);

      const footer = page.getByTestId('site-footer');
      const footerImage = footer.getByAltText('Tenndalux', { exact: true });
      await footerImage.scrollIntoViewIfNeeded();
      await expectDecodedLogo(footerImage, 40);

      await footer.getByRole('link', { name: 'Servicios', exact: true }).click();
      await expect(page).toHaveURL(/\/servicios\/?$/);
      await expect(page.getByRole('heading', { name: 'Productos y Soluciones', exact: true, level: 1 }))
        .toHaveText('Productos y Soluciones');
    });
  });
}

test.describe('public logo navigation in the compact menu', { tag: '@viewport:compact' }, () => {
  test.use(viewportUse('compact'));

  // Bug caught: the overlay still references the removed PNG or its brand link leaves the mobile menu open.
  test('returns home through the compact overlay brand logo', {
    tag: [...FlowTags.PUBLIC_HEADER_NAVIGATION, '@outcome:success'],
  }, async ({ page }) => {
    await openServicesWithLogo(page);
    await page.waitForLoadState('domcontentloaded');
    const toggleMenu = page.getByRole('button', { name: 'Toggle menu', exact: true });
    await toggleMenu.click();

    const closeMenu = page.getByRole('button', { name: 'Close menu', exact: true });
    await expect(closeMenu).toBeVisible();
    const overlayLogo = page.getByTestId('mobile-menu-logo-link');
    const overlayImage = overlayLogo.getByAltText('Tenndalux', { exact: true });
    await expectDecodedLogo(overlayImage, 80);

    await overlayLogo.click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /Tu espacio no solo se estrena\. Se diseña\./ }))
      .toHaveText(/Tu espacio no solo\s*se estrena\.\s*Se diseña\./);
    await expect(closeMenu).toBeHidden();
  });
});
