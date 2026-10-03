import { expect, test, type Page } from '@playwright/test';

type GalleryPhoto = {
  alt: string;
  path: string;
};

const galleryPhotos: GalleryPhoto[] = [
  { alt: 'Cortina Ondessence ondas de lujo', path: '/home/gallery/cortina-ondessence.webp' },
  { alt: 'Cortina Classic elegante', path: '/home/gallery/cortina-classic.webp' },
  { alt: 'Enrollable screen premium', path: '/home/gallery/enrollable-screen.webp' },
  { alt: 'Ambiente decorado con cortinas de lujo', path: '/home/gallery/ejemplo-uso-general.webp' },
  { alt: 'Cortina celular tejido blackout', path: '/home/gallery/cortina-celular-blackout.webp' },
];

async function isolateHomeDependencies(page: Page) {
  await page.route('**/api/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '{}',
  }));
  await page.route('https://apis.google.com/**', (route) => route.abort());
  await page.route('https://www.gstatic.com/**', (route) => route.abort());
}

async function loadPublicHome(page: Page) {
  await isolateHomeDependencies(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL('/');
}

for (const photo of galleryPhotos) {
  // Bug caught: a gallery reference reverts to PNG, serves an oversized/broken image, or changes its approved dimensions.
  test(`gallery photo ${photo.path} stays a bounded WebP`, {
    tag: ['@flow:public-home', '@outcome:display', '@viewport:desktop'],
  }, async ({ page }) => {
    // quality: allow-no-interaction (root-gallery render/network contract: the five photos have no separate user control)
    await loadPublicHome(page);

    const gallery = page.locator('section').filter({
      has: page.getByRole('heading', { name: galleryHeading, exact: true }),
    });
    const image = gallery.getByAltText(photo.alt, { exact: true }).filter({ visible: true });
    const responsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === photo.path && response.request().resourceType() === 'image';
    });

    await image.scrollIntoViewIfNeeded();
    const response = await responsePromise;
    const bytes = (await response.body()).byteLength;

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^image\/webp(?:;|$)/i);
    expect(bytes).toBeLessThanOrEqual(200_000);
    await expect(image).toHaveAttribute('src', photo.path);
    await expect(image).toHaveJSProperty('naturalWidth', 1080);
    await expect(image).toHaveJSProperty('naturalHeight', 1350);
  });
}

const videoViewports = [
  { name: 'compact', size: { width: 412, height: 915 }, bug: 'mobile carousel media or its existing pointer/touch modal flow breaks' },
  { name: 'portrait', size: { width: 835, height: 1194 }, bug: 'the md layout hides gallery media or breaks the full-video modal' },
  { name: 'landscape', size: { width: 1195, height: 835 }, bug: 'the lg layout breaks the gallery/video interaction' },
  { name: 'desktop', size: { width: 1440, height: 900 }, bug: 'desktop grid styling hides media or detaches the existing modal flow' },
  { name: 'wide', size: { width: 2560, height: 1440 }, bug: 'wide layout hides gallery media or breaks the existing modal flow' },
] as const;

const galleryHeading = 'Espacios que inspiran';
const galleryVideoLabel = 'Instalación de cortinas motorizadas';
const fullVideoPath = '/videos/optimized/c56462c7c6fd441d8cebe16d51ee5336.webm';

for (const viewport of videoViewports) {
  test.describe(`gallery video at ${viewport.name}`, () => {
    test.use({ viewport: viewport.size });

    // Bug caught: the breakpoint hides gallery media or breaks the existing full-video modal interaction.
    test(`returns to the gallery after viewing its labelled video at ${viewport.name}`, {
      tag: ['@flow:public-home', '@outcome:display', `@viewport:${viewport.name}`],
    }, async ({ page }) => {
      // quality: allow-duplicate (per-viewport contract: public-home @ exact acceptance viewport)
      await loadPublicHome(page);

      const gallery = page.locator('section').filter({
        has: page.getByRole('heading', { name: galleryHeading, exact: true }),
      });
      const galleryImage = gallery.getByAltText('Cortina Ondessence ondas de lujo', { exact: true }).filter({ visible: true });
      const videoCard = gallery.getByTestId('gallery-video-card').filter({
        has: page.getByLabel(galleryVideoLabel, { exact: true }),
      }).filter({ visible: true });

      await galleryImage.scrollIntoViewIfNeeded();
      await expect(galleryImage).toBeVisible();
      await expect(galleryImage).toHaveAttribute('src', '/home/gallery/cortina-ondessence.webp');
      await videoCard.click();

      const closeButton = page.getByRole('button', { name: 'Cerrar video', exact: true });
      const modalVideo = page.locator('video[controls]');
      const webmSource = page.locator('video[controls] source[type="video/webm"]');
      await expect(closeButton).toBeVisible();
      await expect(webmSource).toHaveCount(1);
      await expect(webmSource).toHaveAttribute('src', fullVideoPath);
      await closeButton.click();
      await expect(modalVideo).toHaveCount(0);
    });
  });
}
