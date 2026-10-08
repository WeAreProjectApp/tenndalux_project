import { test, expect } from './admin-fixture';
import type { Page } from '@playwright/test';
import { FlowTags } from '../helpers/flow-tags';

const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGElEQVR4nGNkaGAgCTCRpnxUw6iGoaQBALsfAKDg6Y6zAAAAAElFTkSuQmCC', 'base64');

async function login(page: Page, email: string, password: string) {
  await page.goto('/admin/', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email address:').fill(email);
  await page.getByLabel('Password:', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/admin\/$/);
}

async function openDocumentForm(page: Page) {
  await page.getByRole('link', { name: 'Documentos de garantía', exact: true }).first().click();
  await page.getByRole('link', { name: 'Add Documento de garantía', exact: true }).click();
}

async function uploadDocument(page: Page, title: string) {
  await openDocumentForm(page);
  await page.getByLabel('Título:', { exact: true }).fill(title);
  await page.getByRole('group', { name: 'Documento PDF:', exact: true }).locator('input[type=file]').setInputFiles({ name: 'fixture.pdf', mimeType: 'application/pdf', buffer: pdf });
  await page.getByRole('checkbox', { name: 'Publicado', exact: true }).check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/core_app\/warrantydocument\/$/);
}

test('Admin publishes a PDF through the document form', {
  tag: [...FlowTags.ADMIN_WARRANTY_DOCUMENT_PUBLISH, '@outcome:success'],
}, async ({ page, adminServer }) => {
  await login(page, adminServer.email, adminServer.password);

  await uploadDocument(page, 'Garantía publicada desde Admin');

  await page.getByRole('rowheader').getByRole('link', { name: 'Garantía publicada desde Admin', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Publicado', exact: true })).toBeChecked();
  const files = await page.request.get('/api/site/warranties/');
  expect(files.status()).toBe(200);
  expect(await files.json()).toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Garantía publicada desde Admin' })]));
});

test('Admin reopens the saved PDF', {
  tag: [...FlowTags.ADMIN_WARRANTY_DOCUMENT_PUBLISH, '@outcome:display'],
}, async ({ page, adminServer }) => {
  await login(page, adminServer.email, adminServer.password);
  await uploadDocument(page, 'Garantía para lectura');
  await page.getByRole('rowheader').getByRole('link', { name: 'Garantía para lectura', exact: true }).click();
  await expect(page.getByLabel('Título:', { exact: true })).toHaveValue('Garantía para lectura');
  const file = page.locator('.field-document a');

  const download = await page.request.get((await file.getAttribute('href'))!);

  expect(download.status()).toBe(200);
  expect(download.headers()['content-type']).toContain('application/pdf');
  expect(await download.body()).toEqual(pdf);
});

test('Admin rejects a file pretending to be a PDF', {
  tag: [...FlowTags.ADMIN_WARRANTY_DOCUMENT_PUBLISH, '@outcome:error'],
}, async ({ page, adminServer }) => {
  await login(page, adminServer.email, adminServer.password);
  await openDocumentForm(page);
  await page.getByLabel('Título:', { exact: true }).fill('Documento inválido');
  await page.getByRole('group', { name: 'Documento PDF:', exact: true }).locator('input[type=file]').setInputFiles({ name: 'invalid.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a PDF') });
  await page.getByRole('checkbox', { name: 'Publicado', exact: true }).check();

  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page.locator('.field-document .errorlist')).toContainText('El archivo no contiene un PDF válido.');
  await page.getByRole('link', { name: 'Documentos de garantía', exact: true }).first().click();
  await expect(page.getByRole('link', { name: 'Documento inválido', exact: true })).toHaveCount(0);
});

async function openHome(page: Page, id: number) {
  await page.getByRole('link', { name: 'Home pages', exact: true }).first().click();
  await page.getByRole('rowheader').getByRole('link', { name: /^Portada/ }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/core_app/homepage/${id}/change/`));
  await expect(page.locator('.field-hero_media .attachments-widget')).toBeVisible();
  await expect(page.locator('input.dz-hidden-input')).toHaveCount(2);
  const gallery = await page.locator('.field-hero_media input[name="hero_media"]').inputValue();
  if (gallery && gallery !== 'None') {
    await expect(page.locator('.field-hero_media .caption')).not.toBeEmpty();
  }
}

async function chooseImage(page: Page, field: string, buffer: Buffer, name: string) {
  const widget = page.locator(`.field-${field} .attachments-widget`);
  const deletes = widget.locator('.attachment:not(.deleted) .delete-link');
  for (const button of await deletes.all()) await button.click();
  const chooser = page.waitForEvent('filechooser');
  await widget.click();
  await (await chooser).element().setInputFiles({ name, mimeType: 'image/png', buffer });
  await expect(widget.getByText(name, { exact: true })).toBeVisible();
}

async function chooseHero(page: Page, buffer: Buffer, name = 'hero-fixture.png') {
  await chooseImage(page, 'hero_media', buffer, name);
}

test('Admin saves an uploaded hero image', {
  tag: [...FlowTags.ADMIN_HOME_HERO_IMAGE_UPDATE, '@outcome:success'],
}, async ({ page, adminServer }) => {
  await login(page, adminServer.email, adminServer.password);
  await openHome(page, adminServer.homeId);
  await chooseHero(page, image);
  await page.getByLabel('Hero title:', { exact: true }).fill('Portada con imagen guardada');

  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page).toHaveURL(/\/admin\/core_app\/homepage\/$/);
  await openHome(page, adminServer.homeId);
  await expect(page.getByLabel('Hero title:', { exact: true })).toHaveValue('Portada con imagen guardada');
  await expect(page.locator('.field-hero_media .caption')).toContainText('hero-fixture.png');
});

test('Admin displays a saved hero thumbnail', {
  tag: [...FlowTags.ADMIN_HOME_HERO_IMAGE_UPDATE, '@outcome:display'],
}, async ({ page, adminServer }) => {
  await login(page, adminServer.email, adminServer.password);
  await openHome(page, adminServer.homeId);
  // Each case establishes its own state through the real upload UI.
  await chooseHero(page, image, 'hero-readable.png');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/core_app\/homepage\/$/);

  await openHome(page, adminServer.homeId);

  const thumbnail = page.locator('.field-hero_media .attachment:not(.deleted) img');
  await expect(page.locator('.field-hero_media .attachment:not(.deleted)')).toHaveCount(1);
  await expect(thumbnail).toBeVisible();
  await expect.poll(() => thumbnail.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  const response = await page.request.get('/api/site/home/');
  const home = await response.json();
  expect(home.hero_image_url).toMatch(/^\/media\/attachments\//);
  const original = await page.request.get(home.hero_image_url);
  expect(original.status()).toBe(200);
  expect(await original.body()).toEqual(image);
});

test('Admin rejects a non-image hero upload without saving the form', {
  tag: [...FlowTags.ADMIN_HOME_HERO_IMAGE_UPDATE, '@outcome:error'],
}, async ({ page, adminServer }) => {
  await login(page, adminServer.email, adminServer.password);
  await openHome(page, adminServer.homeId);
  const originalTitle = await page.getByLabel('Hero title:', { exact: true }).inputValue();
  await page.getByLabel('Hero title:', { exact: true }).fill('This invalid form must not persist');
  await chooseHero(page, Buffer.from('not an image'), 'invalid-image.png');
  await chooseImage(page, 'testimonials_section', image, 'valid-testimonial.png');

  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page.locator('.field-hero_media .messages')).toContainText(/image|imagen/i);
  await expect(page.getByLabel('Hero title:', { exact: true })).toHaveValue('This invalid form must not persist');
  await expect(page.locator('.field-testimonials_section .caption')).toContainText('valid-testimonial.png');
  await expect(page).toHaveURL(new RegExp(`/admin/core_app/homepage/${adminServer.homeId}/change/`));
  await page.reload();
  await expect(page.getByLabel('Hero title:', { exact: true })).toHaveValue(originalTitle);
  await expect(page.getByText('invalid-image.png', { exact: true })).toHaveCount(0);
});

test('Admin recovers a hero upload after validation rejection', {
  tag: [...FlowTags.ADMIN_HOME_HERO_IMAGE_UPDATE, '@outcome:success'],
}, async ({ page, adminServer }) => {
  await login(page, adminServer.email, adminServer.password);
  await openHome(page, adminServer.homeId);
  await chooseHero(page, Buffer.from('not an image'), 'retry-invalid.png');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.field-hero_media .messages')).toContainText(/image|imagen/i);
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled();
  await chooseHero(page, image, 'hero-recovered.png');
  await page.getByLabel('Hero title:', { exact: true }).fill('Portada recuperada');

  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page).toHaveURL(/\/admin\/core_app\/homepage\/$/);
  await openHome(page, adminServer.homeId);
  await expect(page.getByLabel('Hero title:', { exact: true })).toHaveValue('Portada recuperada');
  await expect(page.locator('.field-hero_media .caption')).toContainText('hero-recovered.png');
});

test('Admin recovers a hero save after a network failure', {
  tag: [...FlowTags.ADMIN_HOME_HERO_IMAGE_UPDATE, '@outcome:failure'],
}, async ({ page, context, adminServer }) => {
  await login(page, adminServer.email, adminServer.password);
  await openHome(page, adminServer.homeId);
  await chooseHero(page, image, 'hero-network-recovered.png');
  await page.getByLabel('Hero title:', { exact: true }).fill('Portada tras fallo de red');
  const failedRequest = page.waitForEvent('requestfailed', (request) =>
    new URL(request.url()).pathname.includes('/admin/django_attachments/library/api/'));
  await context.setOffline(true);
  try {
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    expect((await failedRequest).failure()?.errorText).toContain('ERR_INTERNET_DISCONNECTED');
    await expect(page.getByRole('alert')).toContainText(/Error/);
    await expect(page.getByLabel('Hero title:', { exact: true })).toHaveValue('Portada tras fallo de red');
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled();
  } finally {
    await context.setOffline(false);
  }

  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page).toHaveURL(/\/admin\/core_app\/homepage\/$/);
  await openHome(page, adminServer.homeId);
  await expect(page.getByLabel('Hero title:', { exact: true })).toHaveValue('Portada tras fallo de red');
  await expect(page.locator('.field-hero_media .caption')).toContainText('hero-network-recovered.png');
});
