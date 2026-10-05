import { expect, test, type Page } from '@playwright/test';
import { FlowTags } from './helpers/flow-tags';
import { VIEWPORTS, viewportUse, type ViewportAlias } from './helpers/viewports';

const countLabel = '¿Para cuántos espacios buscas cortinas o soluciones de control solar?';
const locationLabel = '¿Dónde se ubica tu proyecto?';
const leadPayload = {
  full_name: 'Ana Pérez', email: 'ana.perez@example.com', phone: '+57 300 123 4567',
  message: 'Me interesa: Luminux', source: 'formulario-home',
};

async function visitContact(page: Page) {
  await page.route('https://apis.google.com/**', (route) => route.abort());
  await page.route('https://www.gstatic.com/**', (route) => route.abort());
  await page.goto('/#contacto', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nombre', { exact: true }).fill('Ana');
  await page.getByLabel('Apellido', { exact: true }).fill('Pérez');
  await page.getByLabel('Email', { exact: true }).fill('ana.perez@example.com');
  await page.getByLabel('Teléfono', { exact: true }).fill('+57 300 123 4567');
  await page.getByLabel('Me interesa', { exact: true }).selectOption('luminux');
}

async function fillProject(page: Page) {
  await page.getByLabel(countLabel, { exact: true }).fill('3');
  await page.getByLabel(locationLabel, { exact: true }).fill('Bogotá, Chapinero');
}

async function captureLeads(page: Page, status = 201) {
  const payloads: unknown[] = [];
  await page.route('**/api/leads/leads/', (route) => {
    payloads.push(route.request().postDataJSON());
    return route.fulfill({ status, contentType: 'application/json', body: '{}' });
  });
  return payloads;
}

async function dialogGeometry(page: Page) {
  return page.getByRole('dialog').evaluate((element) => {
    const box = element.getBoundingClientRect();
    const controls = [...element.querySelectorAll('button')].map((button) => button.getBoundingClientRect());
    return {
      insideViewport: box.top >= 15 && box.bottom <= window.innerHeight - 15,
      boundedHeight: box.height <= window.innerHeight - 31,
      usableButtons: controls.every((control) => control.width >= 44 && control.height >= 44),
      noHorizontalScroll: document.documentElement.scrollWidth <= window.innerWidth,
    };
  });
}

for (const alias of Object.keys(VIEWPORTS) as ViewportAlias[]) {
  test.describe(`contact at ${alias}`, { tag: `@viewport:${alias}` }, () => {
    test.use(viewportUse(alias));

    // R-contact-01/02: portrait splits inputs or feedback loses usable controls and keyboard focus.
    test('submits project details through an operable feedback dialog', {
      tag: [...FlowTags.PUBLIC_CONTACT_SUBMIT, '@outcome:success'],
    }, async ({ page }) => {
      // quality: allow-duplicate (per-viewport contract: public-contact-submit @ canonical viewport)
      const payloads = await captureLeads(page);
      await visitContact(page);
      await fillProject(page);
      const submit = page.getByRole('button', { name: 'Enviar Solicitud', exact: true });

      await submit.click();

      await expect(page.getByRole('dialog')).toContainText('¡Solicitud enviada!');
      expect(payloads).toEqual([{ ...leadPayload, spaces_count: 3, city: 'Bogotá, Chapinero' }]);
      await expect.poll(() => dialogGeometry(page)).toEqual({
        insideViewport: true, boundedHeight: true, usableButtons: true, noHorizontalScroll: true,
      });
      const close = page.getByRole('button', { name: 'Cerrar', exact: true });
      await expect(close).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(page.getByRole('button', { name: 'Volver al sitio', exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(close).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(submit).toBeFocused();
    });
  });
}

test.describe('contact portrait layout', { tag: '@viewport:portrait' }, () => {
  test.use(viewportUse('portrait'));

  // R-contact-02: the name pair must occupy separate full-width rows on portrait tablets.
  test('uses full-width rows before submitting from a portrait tablet', {
    tag: [...FlowTags.PUBLIC_CONTACT_SUBMIT, '@outcome:success'],
  }, async ({ page }) => {
    await captureLeads(page);
    await visitContact(page);
    await expect.poll(async () => {
      const [name, surname] = await Promise.all([
        page.getByLabel('Nombre', { exact: true }).boundingBox(),
        page.getByLabel('Apellido', { exact: true }).boundingBox(),
      ]);
      return {
        aligned: Math.abs(name!.x - surname!.x) < 1,
        fullWidth: Math.abs(name!.width - surname!.width) < 1,
        separateRows: surname!.y > name!.y + name!.height,
      };
    }).toEqual({ aligned: true, fullWidth: true, separateRows: true });

    await page.getByRole('button', { name: 'Enviar Solicitud', exact: true }).click();

    await expect(page.getByRole('dialog')).toContainText('¡Solicitud enviada!');
  });
});

// Bug caught: optional questions accidentally prevent capture for a visitor who has no project details yet.
test('submits when both optional project answers are empty', {
  tag: [...FlowTags.PUBLIC_CONTACT_SUBMIT, '@outcome:success'],
}, async ({ page }) => {
  const payloads = await captureLeads(page);
  await visitContact(page);

  await page.getByRole('button', { name: 'Enviar Solicitud', exact: true }).click();

  await expect(page.getByRole('dialog')).toContainText('¡Solicitud enviada!');
  expect(payloads).toEqual([leadPayload]);
});

// Bug caught: invalid optional numbers reach the API and trigger an avoidable generic error.
test('corrects an invalid number beside the question before sending', {
  tag: [...FlowTags.PUBLIC_CONTACT_SUBMIT, '@outcome:error'],
}, async ({ page }) => {
  const payloads = await captureLeads(page);
  await visitContact(page);
  await page.getByLabel(countLabel, { exact: true }).fill('0');

  await page.getByRole('button', { name: 'Enviar Solicitud', exact: true }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'Ingresa una cantidad entera de espacios desde 1.' }))
    .toHaveText('Ingresa una cantidad entera de espacios desde 1.');
  expect(payloads).toEqual([]);
  await page.getByLabel(countLabel, { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Enviar Solicitud', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('¡Solicitud enviada!');
  expect(payloads).toEqual([{ ...leadPayload, spaces_count: 3 }]);
});

// Bug caught: a rejected submission erases the visitor's new project answers.
test('keeps the project answers after a rejected submission', {
  tag: [...FlowTags.PUBLIC_CONTACT_SUBMIT, '@outcome:failure'],
}, async ({ page }) => {
  await captureLeads(page, 500);
  await visitContact(page);
  await fillProject(page);

  await page.getByRole('button', { name: 'Enviar Solicitud', exact: true }).click();

  await expect(page.getByRole('dialog')).toContainText('No pudimos enviar tu solicitud');
  await page.getByRole('button', { name: 'Volver e intentar de nuevo', exact: true }).click();
  await expect(page.getByLabel(countLabel, { exact: true })).toHaveValue('3');
  await expect(page.getByLabel(locationLabel, { exact: true })).toHaveValue('Bogotá, Chapinero');
  await expect(page.getByRole('button', { name: 'Enviar Solicitud', exact: true })).toBeEnabled();
});

test.describe('contact feedback with reduced height', { tag: '@viewport:landscape' }, () => {
  test.use({ viewport: { width: VIEWPORTS.landscape.width, height: 320 }, hasTouch: true });

  // R-contact-01: the feedback panel must scroll internally and keep its close control reachable.
  test('reaches the return control through a short feedback dialog', {
    tag: [...FlowTags.PUBLIC_CONTACT_SUBMIT, '@outcome:success'],
  }, async ({ page }) => {
    await captureLeads(page);
    await visitContact(page);

    await page.getByRole('button', { name: 'Enviar Solicitud', exact: true }).click();

    await expect(page.getByRole('dialog')).toContainText('¡Solicitud enviada!');
    await expect.poll(() => dialogGeometry(page)).toEqual({
      insideViewport: true, boundedHeight: true, usableButtons: true, noHorizontalScroll: true,
    });
    await page.getByRole('button', { name: 'Volver al sitio', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Enviar Solicitud', exact: true })).toBeFocused();
  });
});
