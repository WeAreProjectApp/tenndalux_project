import { expect, type Locator } from '@playwright/test';

/**
 * Wait until React has hydrated the element behind `locator`.
 *
 * The E2E server is `next dev`: a page reached through a full page load shows
 * its server HTML well before React attaches its handlers, and a click in that
 * window is lost. React DOM stores each hydrated node's props, handlers
 * included, under a `__reactProps$<id>` key and reads them from there when an
 * event fires, so once the key exists the element's handlers are live.
 */
export async function waitForHydration(locator: Locator): Promise<void> {
  await expect
    .poll(() => locator.evaluate((node) => Object.keys(node).some((key) => key.startsWith('__reactProps$'))), {
      message: 'React never hydrated the element',
      timeout: 20_000,
    })
    .toBe(true);
}

/** Click `locator` once React has hydrated it (see `waitForHydration`). */
export async function clickWhenHydrated(locator: Locator): Promise<void> {
  await waitForHydration(locator);
  await locator.click();
}
