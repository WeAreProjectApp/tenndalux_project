import { expect, test } from '@playwright/test';
import { FlowTags } from '../helpers/flow-tags';
import { viewportUse, type ViewportAlias } from '../helpers/viewports';
import { expectNoDocumentOverflow, expectTouchTarget, reachHomeThroughUi } from './helpers';

const brandSource = '/videos/optimized/copy_429DCD28-111F-43D8-BC3D-9277828BFA0D.webm';

for (const alias of ['compact', 'portrait', 'landscape', 'desktop', 'wide'] as ViewportAlias[]) {
  test.describe(`brand video @ ${alias}`, () => {
    test.use(viewportUse(alias));
    // Bug caught: the brand video opens an inaccessible player or loses its trigger after dismissal.
    test('returns to the brand video trigger after playback', {
      tag: [...FlowTags.PUBLIC_BRAND_VIDEO, '@outcome:display', '@outcome:success', `@viewport:${alias}`],
    }, async ({ page }) => {
      // quality: allow-duplicate (per-viewport contract: public-brand-video @ canonical reference viewport)
      await reachHomeThroughUi(page);
      const opener = page.getByRole('button', { name: 'Reproducir video de Tenndalux' });
      await opener.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Cortinas motorizadas Tenndalux' });
      const player = dialog.getByLabel('Cortinas motorizadas Tenndalux', { selector: 'video' });
      await expect(player.locator('source[type="video/webm"]')).toHaveAttribute('src', brandSource);
      await expect.poll(() => player.evaluate((video: HTMLVideoElement) => video.readyState >= 2 && !video.paused)).toBe(true);
      const close = dialog.getByRole('button', { name: 'Cerrar video' });
      await expectTouchTarget(close);
      await expect(close).toBeInViewport();
      await close.click();
      await expect(opener).toBeFocused();
      await expectNoDocumentOverflow(page);
    });
  });
}

for (const alias of ['compact', 'portrait'] as const) {
  test.describe(`video dismissal @ ${alias}`, () => {
    test.use(viewportUse(alias));
    for (const dismissal of ['Escape', 'background'] as const) {
      // Bug caught: keyboard/backdrop dismissal leaks focus to the underlying page.
      test(`dismisses the video with ${dismissal}`, {
        tag: [...FlowTags.PUBLIC_BRAND_VIDEO, '@outcome:success', `@viewport:${alias}`],
      }, async ({ page }) => {
        // quality: allow-duplicate (per-viewport contract: video dismissal @ compact and portrait)
        await reachHomeThroughUi(page);
        const opener = page.getByRole('button', { name: 'Reproducir video de Tenndalux' });
        await opener.click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByRole('button', { name: 'Cerrar video' })).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
        await dismissVideo(page, dismissal);
        await expect(dialog).toHaveCount(0);
        await expect(opener).toBeFocused();
        expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
      });
    }
  });
}

async function dismissVideo(page: import('@playwright/test').Page, dismissal: string) {
  if (dismissal === 'Escape') await page.keyboard.press('Escape');
  else await page.getByRole('dialog').click({ position: { x: 8, y: 8 } });
}
