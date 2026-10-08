import type { AxiosResponse } from 'axios';
import { get } from '@/lib/services/http';
import { listBlogPosts, listPortfolioProjects } from '@/lib/services/content';

jest.mock('@/lib/services/http', () => ({ get: jest.fn() }));
const mockedGet = get as jest.MockedFunction<typeof get>;

describe.each([
  { catalogue: 'blog', endpoint: '/blog/posts/', list: listBlogPosts },
  { catalogue: 'portfolio', endpoint: '/portfolio/projects/', list: listPortfolioProjects },
])('$catalogue pagination destination', ({ endpoint, list }) => {
  beforeEach(() => {
    mockedGet.mockReset();
    jest.replaceProperty(process, 'env', { ...process.env, NEXT_PUBLIC_API_URL: 'https://api.example.test/api' });
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['external origin', 'https://untrusted.example/api'],
    ['protocol-relative external origin', '//untrusted.example/api'],
    ['insecure origin', 'http://api.example.test/api'],
    ['embedded credentials', 'https://user:password@api.example.test/api'],
    ['different API prefix', 'https://api.example.test/private'],
  ])('rejects a next link using %s', async (_label, prefix) => {
    mockedGet.mockResolvedValue({ data: { results: [{ id: 1 }], next: `${prefix}${endpoint}?page=2` } } as AxiosResponse);

    await expect(list()).rejects.toThrow('Invalid catalogue pagination destination');
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it('rejects a link to another endpoint before sending credentials', async () => {
    mockedGet.mockResolvedValue({ data: { results: [{ id: 1 }], next: '/api/auth/profile/?page=2' } } as AxiosResponse);

    await expect(list()).rejects.toThrow('Invalid catalogue pagination destination');
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it('rejects a link carrying a fragment', async () => {
    mockedGet.mockResolvedValue({ data: { results: [{ id: 1 }], next: '?page=2#fragment' } } as AxiosResponse);

    await expect(list()).rejects.toThrow('Invalid catalogue pagination destination');
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['missing results', { next: null }],
    ['invalid results', { results: {}, next: null }],
    ['invalid next', { results: [{ id: 1 }], next: 2 }],
  ])('rejects a later page with %s', async (_label, data) => {
    mockedGet.mockResolvedValueOnce({ data: { results: [{ id: 1 }], next: '?page=2' } } as AxiosResponse)
      .mockResolvedValueOnce({ data } as AxiosResponse);

    await expect(list()).rejects.toThrow('Invalid catalogue page');
  });
});
