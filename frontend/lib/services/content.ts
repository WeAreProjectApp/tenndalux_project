/**
 * Contenido publicado desde el admin: posts del blog y proyectos del portafolio.
 *
 * El detalle se pide por slug —es lo que trae la URL— y no por id, que no
 * aparece en ninguna parte de la web pública.
 */
import { get } from '@/lib/services/http';
import { resolveApiBaseUrl } from '@/lib/apiConfig';
import type { BlogPost, PortfolioProject } from '@/types/content';

/** La API pagina por defecto (PAGE_SIZE 20). */
type Paginated<T> = { count: number; next: string | null; results: T[] };

/** Follow only this catalogue's pages: the HTTP wrapper also sends credentials. */
async function listPublishedContent<T>(endpoint: string): Promise<T[]> {
  const apiBase = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL, process.env.NODE_ENV === 'production');
  const siteOrigin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const firstPage = new URL(`${apiBase.replace(/\/+$/, '')}${endpoint}`, siteOrigin);
  const visited = new Set<string>();
  const results: T[] = [];
  let pageUrl: URL | null = firstPage;

  while (pageUrl) {
    if (pageUrl.origin !== firstPage.origin || pageUrl.pathname !== firstPage.pathname
      || pageUrl.username || pageUrl.password || pageUrl.hash) {
      throw new Error('Invalid catalogue pagination destination');
    }
    pageUrl.searchParams.sort();
    const pageKey = pageUrl.toString();
    if (visited.has(pageKey)) throw new Error('Catalogue pagination cycle');
    visited.add(pageKey);

    const response = await get<Paginated<T>>(`${endpoint}${pageUrl.search}`);
    const data = response.data;
    if (!data || !Array.isArray(data.results)
      || (data.next !== null && (typeof data.next !== 'string' || !data.next.trim()))) {
      throw new Error('Invalid catalogue page');
    }
    results.push(...data.results);
    pageUrl = data.next === null ? null : new URL(data.next, pageUrl);
  }

  return results;
}

/**
 * El backend devuelve las rutas de media relativas (`/media/…`). En producción
 * comparten dominio con la web y ya resuelven; en desarrollo el front corre en
 * otro puerto, así que hay que anteponerle el origen de la API.
 */
export function mediaUrl(path: string): string {
  if (!path || /^https?:\/\//.test(path)) return path;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  try {
    return new URL(path, new URL(apiBase).origin).toString();
  } catch {
    return path;
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost> {
  const response = await get<BlogPost>(`/blog/posts/${slug}/`);
  return response.data;
}

export async function getPortfolioProject(slug: string): Promise<PortfolioProject> {
  const response = await get<PortfolioProject>(`/portfolio/projects/${slug}/`);
  return response.data;
}

export async function listBlogPosts(): Promise<BlogPost[]> {
  return listPublishedContent<BlogPost>('/blog/posts/');
}

export async function listPortfolioProjects(): Promise<PortfolioProject[]> {
  return listPublishedContent<PortfolioProject>('/portfolio/projects/');
}
