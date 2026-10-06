import { expect, test, type Page } from '@playwright/test';

const warrantyEndpoint = '**/api/site/warranties/';
const homeEndpoint = '**/api/site/home/';
const bundledHeroImage = '/home/hero-background.webp';
const cmsHeroImage = '/home/cta-background.webp';

async function openWarrantiesFromFooter(page: Page) {
  await page.goto('/servicios/', { waitUntil: 'domcontentloaded' });

  await page.getByRole('link', { name: 'Garantía', exact: true }).click();
  await expect(page).toHaveURL(/\/garantias\/$/);
}

async function openHomeFromHeader(page: Page) {
  await page.goto('/servicios/', { waitUntil: 'domcontentloaded' });
  const homeUrl = new URL('/', page.url()).toString();

  await page.locator('header').getByRole('link', { name: 'Inicio', exact: true }).click();
  await expect(page).toHaveURL(homeUrl);
}

// Bug caught: the Footer link can miss the CMS page, cards can fail to render, or a published PDF can become unusable.
test('guest opens a published warranty PDF after navigating from the Footer', {
  tag: ['@flow:public-warranty-documents', '@outcome:success'],
}, async ({ page }) => {
  const pdfUrl = 'http://127.0.0.1:3106/media/warranties/guia-garantia.pdf';
  await page.route(warrantyEndpoint, (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([{ id: 7, title: 'Guía de garantía 2026', file_url: pdfUrl }]),
  }));
  await page.context().route(pdfUrl, (route) => route.fulfill({
    contentType: 'application/pdf',
    path: 'public/legal/politica-de-garantia.pdf',
  }));

  await openWarrantiesFromFooter(page);

  const documentLink = page.getByRole('link', { name: 'Abrir Guía de garantía 2026 (PDF)', exact: true });
  await expect(documentLink).toHaveAttribute('href', pdfUrl);

  const pdfRequestPromise = page.context().waitForEvent('request', (request) => request.url() === pdfUrl);
  const popupPromise = page.waitForEvent('popup');
  await documentLink.click();
  const popup = await popupPromise;
  const pdfRequest = await pdfRequestPromise;
  expect(pdfRequest.method()).toBe('GET');
  expect(pdfRequest.url()).toBe(pdfUrl);
  await popup.close();
});

// Bug caught: one transient API error can permanently prevent visitors from reading published warranty documents.
test('guest retries a failed warranty request', {
  tag: ['@flow:public-warranty-documents', '@outcome:failure'],
}, async ({ page }) => {
  let requests = 0;
  await page.route(warrantyEndpoint, (route) => {
    requests += 1;
    if (requests === 1) {
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    }
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([{ id: 8, title: 'Garantía renovada', file_url: '/media/warranties/renovada.pdf' }]),
    });
  });

  await openWarrantiesFromFooter(page);

  await expect(page.getByRole('alert').filter({ hasText: 'No pudimos cargar los documentos' }))
    .toContainText('No pudimos cargar los documentos');
  await page.getByRole('button', { name: 'Volver a intentar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Abrir Garantía renovada (PDF)', exact: true }))
    .toHaveAttribute('href', '/media/warranties/renovada.pdf');
  expect(requests).toBe(2);
});

// Bug caught: an empty published catalogue can look like a failed or broken warranty page.
test('guest reads the warranty empty state after navigating from the Footer', {
  tag: ['@flow:public-warranty-documents', '@outcome:display'],
}, async ({ page }) => {
  await page.route(warrantyEndpoint, (route) => route.fulfill({
    contentType: 'application/json',
    body: '[]',
  }));

  await openWarrantiesFromFooter(page);

  await expect(page.getByText('No hay documentos adicionales publicados por el momento.', { exact: true }))
    .toBeVisible();
});

// Bug caught: Home can ignore the image selected in the CMS after a visitor uses public navigation.
test('guest sees the CMS Home cover after navigating with the Header', {
  tag: ['@flow:public-home-hero-image', '@outcome:display'],
}, async ({ page }) => {
  await page.route(homeEndpoint, (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ hero_image_url: cmsHeroImage }),
  }));

  await openHomeFromHeader(page);

  const hero = page.getByTestId('hero-image');
  await expect(hero).toBeVisible();
  await expect(hero).toHaveJSProperty('src', new URL(cmsHeroImage, page.url()).toString());
});

// Bug caught: a deleted CMS upload can leave Home without a usable marketing cover.
test('guest keeps the bundled Home cover when CMS media fails to load', {
  tag: ['@flow:public-home-hero-image', '@outcome:failure'],
}, async ({ page }) => {
  const brokenCmsImage = '/media/home/broken-cms-hero.webp';
  let imageRequests = 0;
  await page.route(homeEndpoint, (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ hero_image_url: brokenCmsImage }),
  }));
  await page.route('**/media/home/broken-cms-hero.webp', (route) => {
    imageRequests += 1;
    return route.abort('failed');
  });

  await openHomeFromHeader(page);

  const hero = page.getByTestId('hero-image');
  await expect.poll(() => imageRequests).toBe(1);
  await expect(hero).toHaveJSProperty('src', new URL(bundledHeroImage, page.url()).toString());
});

// Bug caught: a Home API outage can remove the bundled cover while the visitor navigates back to the landing page.
test('guest keeps the bundled Home cover when the CMS API fails', {
  tag: ['@flow:public-home-hero-image', '@outcome:failure'],
}, async ({ page }) => {
  let homeRequests = 0;
  await page.route(homeEndpoint, (route) => {
    homeRequests += 1;
    return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });

  await openHomeFromHeader(page);

  await expect.poll(() => homeRequests).toBe(1);
  await expect(page.getByTestId('hero-image'))
    .toHaveJSProperty('src', new URL(bundledHeroImage, page.url()).toString());
});
