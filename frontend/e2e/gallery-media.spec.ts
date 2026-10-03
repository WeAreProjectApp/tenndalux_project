import { expect, test, type Locator, type Page } from '@playwright/test';

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

const galleryHeading = 'Espacios que inspiran';
const galleryVideoLabel = 'Instalación de cortinas motorizadas';
const fullVideoPath = '/videos/optimized/c56462c7c6fd441d8cebe16d51ee5336.webm';

async function scrollGalleryIntoView(_page: Page, galleryImage: Locator) {
  await galleryImage.scrollIntoViewIfNeeded();
}

async function swipeToNextGalleryItem(page: Page, galleryImage: Locator) {
  await galleryImage.scrollIntoViewIfNeeded();
  const box = await galleryImage.boundingBox();
  expect(box).not.toBeNull();

  const centerY = box!.y + box!.height / 2;
  await page.mouse.move(box!.x + box!.width * 0.8, centerY);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.2, centerY, { steps: 10 });
  await page.mouse.up();
}

const videoViewports = [
  { name: 'compact', size: { width: 412, height: 915 }, prepareVideo: swipeToNextGalleryItem },
  { name: 'portrait', size: { width: 835, height: 1194 }, prepareVideo: scrollGalleryIntoView },
  { name: 'landscape', size: { width: 1195, height: 835 }, prepareVideo: scrollGalleryIntoView },
  { name: 'desktop', size: { width: 1440, height: 900 }, prepareVideo: scrollGalleryIntoView },
  { name: 'wide', size: { width: 2560, height: 1440 }, prepareVideo: scrollGalleryIntoView },
] as const;

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

      await viewport.prepareVideo(page, galleryImage);
      await expect(galleryImage).toBeVisible();
      await expect(galleryImage).toHaveAttribute('src', '/home/gallery/cortina-ondessence.webp');
      const visibleVideo = gallery.getByLabel(galleryVideoLabel, { exact: true }).filter({ visible: true });
      // quality: allow-fragile-selector (the labelled video has an overlay; its nearest explicitly marked card is the stable click target across Swiper and grid copies)
      const videoCard = visibleVideo.locator('xpath=ancestor::*[@data-testid="gallery-video-card"][1]');
      await expect(visibleVideo).toBeInViewport({ ratio: 0.9 });
      const cardBox = (await videoCard.boundingBox())!;
      await page.mouse.click(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);

      const closeButton = page.getByRole('button', { name: 'Cerrar video', exact: true });
      const modalVideo = page.locator('video[controls]');
      const webmSource = page.locator('video[controls] source[type="video/webm"]');
      await expect(closeButton).toBeVisible();
      await expect(webmSource).toHaveCount(1);
      await expect(webmSource).toHaveAttribute('src', fullVideoPath);
      const closeBox = (await closeButton.boundingBox())!;
      await page.mouse.click(closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2);
      await expect(modalVideo).toHaveCount(0);
    });
  });
}
