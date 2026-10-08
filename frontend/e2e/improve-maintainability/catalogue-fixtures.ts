import type { Page } from '@playwright/test';
import type { BlogPost, PortfolioProject } from '@/types/content';

export const blogPosts: BlogPost[] = Array.from({ length: 21 }, (_, index) => ({
  id: index + 1,
  slug: `articulo-${index + 1}`,
  title: index === 0 ? 'Portada de diseño' : `Artículo publicado ${index + 1}`,
  excerpt: `Consejos del artículo ${index + 1}`,
  content_blocks: [],
  cover_image_url: null,
  published_at: '2026-10-01T10:00:00Z',
  created_at: '2026-10-01T10:00:00Z',
  meta_title: '',
  meta_description: '',
  tags: [{ id: index + 1, name: index === 20 ? 'Guías finales' : 'Diseño', slug: `tag-${index + 1}` }],
  read_time_minutes: index + 1,
}));

export const portfolioProjects: PortfolioProject[] = Array.from({ length: 21 }, (_, index) => ({
  id: index + 1,
  slug: `proyecto-${index + 1}`,
  title: index === 0 ? 'Residencia de portada' : `Proyecto publicado ${index + 1}`,
  description: `Instalación del proyecto ${index + 1}`,
  content_blocks: [],
  cover_image_url: null,
  location: 'Medellín, Colombia',
  year: 2026,
  featured: index < 2,
  categories: [{ id: index + 1, name: index === 20 ? 'Hotelería' : 'Residencial', slug: `category-${index + 1}` }],
  styles: [{ id: 1, name: 'Automatización', slug: 'automatizacion' }],
}));

/** Mock the public API boundary, preserving its real 20-entry pagination. */
export async function routeCatalogue<T>(page: Page, endpoint: string, entries: T[], failedPage?: number) {
  let failure = failedPage;
  const requestedPages: number[] = [];
  await page.route(`**/api${endpoint}**`, async (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get('page') || 1);
    requestedPages.push(pageNumber);
    if (pageNumber === failure) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"Unavailable"}' });
      return;
    }
    const next = entries.length > pageNumber * 20 ? `${url.origin}${url.pathname}?page=${pageNumber + 1}` : null;
    await route.fulfill({ json: { count: entries.length, next, previous: null, results: entries.slice((pageNumber - 1) * 20, pageNumber * 20) } });
  });
  return { requestedPages, recover: () => { failure = undefined; } };
}
