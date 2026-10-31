import type { Page } from '@playwright/test';
import products from '../fixtures/products.json';

/** Public API boundary for catalogue specs that do not run Django. */
export async function routeProducts(page: Page) {
  await page.route('**/api/products/', (route) => route.fulfill({ json: products }));
}
