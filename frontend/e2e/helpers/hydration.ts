import { expect, type Locator } from '@playwright/test';

/**
 * Wait until React has hydrated the element behind `locator` and committed it.
 *
 * The E2E server is `next dev`: a page reached through a full page load shows
 * its server HTML well before React attaches its handlers, and a click or a
 * fill in that window is lost. React DOM links each node to its fiber under a
 * `__reactFiber$<id>` key while it hydrates, but it only dispatches an event to
 * a fiber that is already mounted: until the hydration commits, it replays or
 * drops the event. The check mirrors React DOM's getNearestMountedFiber, where
 * a fiber that still carries the Placement or Hydrating flag (4098), or sits
 * under one, is not mounted yet.
 */
export async function waitForHydration(locator: Locator): Promise<void> {
  await locator.waitFor();
  await expect
    .poll(
      () =>
        locator.evaluate((node) => {
          type Fiber = { alternate: Fiber | null; flags: number; return: Fiber | null; tag: number };
          const key = Object.keys(node).find((name) => name.startsWith('__reactFiber$'));
          if (!key) return false;
          const target = (node as unknown as Record<string, Fiber>)[key];
          let nearestMounted: Fiber | null = target;
          let fiber = target;
          for (let next: Fiber | null = target; next && !next.alternate; next = next.return) {
            fiber = next;
            if (fiber.flags & 4098) nearestMounted = fiber.return;
          }
          while (fiber.return) fiber = fiber.return;
          return fiber.tag === 3 && nearestMounted === target;
        }),
      { message: 'React never hydrated the element', timeout: 20_000 },
    )
    .toBe(true);
}

/** Click `locator` once React has hydrated it (see `waitForHydration`). */
export async function clickWhenHydrated(locator: Locator): Promise<void> {
  await waitForHydration(locator);
  await locator.click();
}
