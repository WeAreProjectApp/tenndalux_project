import { expect, test } from '@playwright/test';
import { FlowTags, RoleTags } from '../helpers/flow-tags';
import { portfolioProjects, routeCatalogue } from './catalogue-fixtures';

test.beforeEach(async ({ page }) => {
  await routeCatalogue(page, '/portfolio/projects/', [portfolioProjects[0]]);
  await page.goto('/servicios/', { waitUntil: 'domcontentloaded' });
});

// Bug caught: opening a reel displays the wrong title or unusable video media.
test('visitor reads the selected showreel after navigating to Portfolio', {
  tag: [...FlowTags.PUBLIC_PORTFOLIO_SHOWREEL, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await page.getByRole('banner').getByRole('link', { name: 'Portafolio', exact: true }).click();
  await expect(page).toHaveURL(/\/portafolio\/$/);

  await page.getByRole('button', { name: 'Ver video: Automatización en Acción', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'Videos del portafolio', exact: true });
  await expect(dialog).toContainText('Automatización en Acción');
  await expect(dialog).toContainText('1 / 10');
  await expect(dialog.getByTestId('portfolio-showreel-video')).toHaveAttribute('src', '/videos/optimized/IMG_5435.webm');
  await expect.poll(() => dialog.getByTestId('portfolio-showreel-video').evaluate((video: HTMLVideoElement) => video.readyState)).toBeGreaterThanOrEqual(2);
});

// Bug caught: the next/previous controls fail to change the selected reel.
test('visitor changes the showreel selection', {
  tag: [...FlowTags.PUBLIC_PORTFOLIO_SHOWREEL, RoleTags.GUEST, '@outcome:success'],
}, async ({ page }) => {
  await page.getByRole('banner').getByRole('link', { name: 'Portafolio', exact: true }).click();
  await expect(page).toHaveURL(/\/portafolio\/$/);
  await page.getByRole('button', { name: 'Ver video: Automatización en Acción', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Videos del portafolio', exact: true });

  await dialog.getByRole('button', { name: 'Video siguiente', exact: true }).click();

  await expect(dialog).toContainText('Instalación Paso a Paso');
  await expect(dialog.getByTestId('portfolio-showreel-video')).toHaveAttribute('src', '/videos/optimized/IMG_5455.webm');
  await dialog.getByRole('button', { name: 'Video anterior', exact: true }).click();
  await expect(dialog).toContainText('Automatización en Acción');
  await expect(dialog.getByTestId('portfolio-showreel-video')).toHaveAttribute('src', '/videos/optimized/IMG_5435.webm');
});

// Bug caught: closing a showreel leaves its overlay over the portfolio controls.
test('visitor closes the portfolio showreel', {
  tag: [...FlowTags.PUBLIC_PORTFOLIO_SHOWREEL, RoleTags.GUEST, '@outcome:success'],
}, async ({ page }) => {
  await page.getByRole('banner').getByRole('link', { name: 'Portafolio', exact: true }).click();
  await expect(page).toHaveURL(/\/portafolio\/$/);
  await page.getByRole('button', { name: 'Ver video: Automatización en Acción', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Automatización en Acción');

  await page.getByRole('button', { name: 'Cerrar video', exact: true }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Residencial', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Residencia de portada', exact: true, level: 3 })).toHaveText('Residencia de portada');
});
