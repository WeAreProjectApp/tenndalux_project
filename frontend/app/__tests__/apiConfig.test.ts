import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { resolveApiBaseUrl } from '@/lib/apiConfig';

type Adapter = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

let respond: Adapter;
const adapter = jest.fn((config: InternalAxiosRequestConfig) => respond(config));
axios.defaults.adapter = adapter;

const response = (config: InternalAxiosRequestConfig): AxiosResponse => ({
  config,
  data: {},
  headers: {},
  status: 200,
  statusText: 'OK',
});

describe('API base URL configuration', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeAll(async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.NEXT_PUBLIC_API_URL;
    respond = async (config) => response(config);
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  });

  beforeEach(() => {
    adapter.mockClear();
    process.env.NODE_ENV = 'production';
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterEach(() => {
    process.env.NODE_ENV = 'production';
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('posts a production lead to the site-relative API', async () => {
    // Falla si un export sin configuración pública vuelve a enviar el formulario al localhost del visitante.
    const { post } = await import('@/lib/services/http');

    await post('/leads/leads/', { full_name: 'Ana Rodríguez' });

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(adapter.mock.calls[0][0].baseURL).toBe('/api');
    expect(adapter.mock.calls[0][0].url).toBe('/leads/leads/');
  });

  test.each([
    [undefined, false, 'http://localhost:8000/api'],
    ['/api', true, '/api'],
    ['https://api.tenndalux.com/api', true, 'https://api.tenndalux.com/api'],
  ] as const)('resolves %s in production=%s to %s', (configured, production, expected) => {
    // Falla si desarrollo pierde su API local o producción rechaza un origen HTTPS público válido.
    expect(resolveApiBaseUrl(configured, production)).toBe(expected);
  });

  test.each([
    'http://api.tenndalux.com/api',
    'http://localhost:8000/api',
    'https://127.0.0.1:8000/api',
    'https://service.localhost/api',
  ])('rejects unsafe production API URL %s', (configured) => {
    // Falla si un build de producción vuelve a aceptar una URL remota insegura o de loopback.
    expect(() => resolveApiBaseUrl(configured, true)).toThrow(
      'Production API URL must use a relative path or a public HTTPS origin.',
    );
  });

  it('stops a production build configured with localhost before export', async () => {
    // Falla si Next permite publicar un bundle que apunta al equipo de cada visitante.
    const nodeEnv = process.env.NODE_ENV;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api';

    try {
      await expect(jest.isolateModulesAsync(async () => {
        await import('../../next.config');
      })).rejects.toThrow('Production API URL must use a relative path or a public HTTPS origin.');
    } finally {
      process.env.NODE_ENV = nodeEnv;
      if (apiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
      else process.env.NEXT_PUBLIC_API_URL = apiUrl;
    }
  });
});
