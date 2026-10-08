import type { AxiosResponse } from 'axios';
import { get } from '@/lib/services/http';
import { listBlogPosts, listPortfolioProjects } from '@/lib/services/content';

jest.mock('@/lib/services/http', () => ({ get: jest.fn() }));
const mockedGet = get as jest.MockedFunction<typeof get>;
const entry = (id: number) => ({ id, title: `Published entry ${id}` });
const page = (ids: number[], next: string | null = null) => ({
  data: { count: 21, results: ids.map(entry), next },
} as AxiosResponse);

describe.each([
  { catalogue: 'blog', endpoint: '/blog/posts/', list: listBlogPosts },
  { catalogue: 'portfolio', endpoint: '/portfolio/projects/', list: listPortfolioProjects },
])('$catalogue pagination', ({ endpoint, list }) => {
  beforeEach(() => {
    mockedGet.mockReset();
    jest.replaceProperty(process, 'env', { ...process.env, NEXT_PUBLIC_API_URL: 'https://api.example.test/api' });
  });
  afterEach(() => jest.restoreAllMocks());

  it('returns the published entries from an unpaginated catalogue', async () => {
    mockedGet.mockResolvedValue(page([1, 2]));

    expect(await list()).toEqual([entry(1), entry(2)]);
  });

  it('includes entry 21 from a relative next page', async () => {
    const firstPageIds = Array.from({ length: 20 }, (_, index) => index + 1);
    mockedGet.mockResolvedValueOnce(page(firstPageIds, '?page=2')).mockResolvedValueOnce(page([21]));

    const entries = await list();

    expect(entries).toHaveLength(21);
    expect(entries[20]).toEqual(entry(21));
    expect(mockedGet).toHaveBeenLastCalledWith(`${endpoint}?page=2`);
  });

  it('follows an absolute link on the configured API origin', async () => {
    mockedGet.mockResolvedValueOnce(page([1], `https://api.example.test/api${endpoint}?page=2`))
      .mockResolvedValueOnce(page([2]));

    expect(await list()).toEqual([entry(1), entry(2)]);
    expect(mockedGet).toHaveBeenLastCalledWith(`${endpoint}?page=2`);
  });

  it('resolves root-relative links for a same-site API', async () => {
    jest.replaceProperty(process, 'env', { ...process.env, NEXT_PUBLIC_API_URL: '/gateway/api/' });
    mockedGet.mockResolvedValueOnce(page([1], `/gateway/api${endpoint}?page=2`))
      .mockResolvedValueOnce(page([2]));

    expect(await list()).toEqual([entry(1), entry(2)]);
  });

  it('rejects the catalogue when a later page fails', async () => {
    mockedGet.mockResolvedValueOnce(page([1], '?page=2')).mockRejectedValueOnce(new Error('Page unavailable'));

    await expect(list()).rejects.toThrow('Page unavailable');
  });

  it('stops a link returning to the first page', async () => {
    mockedGet.mockResolvedValueOnce(page([1], '?page=2')).mockResolvedValueOnce(page([2], `https://api.example.test/api${endpoint}`));

    await expect(list()).rejects.toThrow('Catalogue pagination cycle');
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it('detects a cycle with reordered query parameters', async () => {
    mockedGet.mockResolvedValueOnce(page([1], '?page=2&ordering=title'))
      .mockResolvedValueOnce(page([2], '?ordering=title&page=2'));

    await expect(list()).rejects.toThrow('Catalogue pagination cycle');
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });
});
