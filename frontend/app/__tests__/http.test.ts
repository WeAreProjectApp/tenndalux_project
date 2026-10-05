import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

type Adapter = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

let respond: Adapter;
const adapter = jest.fn((config: InternalAxiosRequestConfig) => respond(config));

// The real Axios request and response interceptors run against this boundary.
axios.defaults.adapter = adapter;

const response = (config: InternalAxiosRequestConfig, data: unknown = {}) => ({
  config,
  data,
  headers: {},
  status: 200,
  statusText: 'OK',
});

const unauthorized = (config: InternalAxiosRequestConfig) => new AxiosError(
  'expired access token',
  'ERR_BAD_REQUEST',
  config,
  undefined,
  {
    config,
    data: {},
    headers: {},
    status: 401,
    statusText: 'Unauthorized',
  },
);

const authorization = (config: InternalAxiosRequestConfig) => String(config.headers.Authorization);
const refreshBody = (config: InternalAxiosRequestConfig) => JSON.parse(String(config.data));

describe('HTTP token recovery', () => {
  let http: typeof import('@/lib/services/http');

  beforeAll(async () => {
    http = await import('@/lib/services/http');
  });

  beforeEach(() => {
    adapter.mockClear();
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    localStorage.clear();
    respond = async (config) => response(config);
  });

  afterAll(() => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    localStorage.clear();
  });

  it('uses the rotated refresh credential for a later recovery', async () => {
    // Falla si una recuperación posterior reutiliza el refresh token que el servidor ya invalidó.
    Cookies.set('access_token', 'a0');
    Cookies.set('refresh_token', 'r0');
    const refreshPayloads: Array<{ refresh: string }> = [];
    const protectedAuthorizations: string[] = [];
    let refreshCount = 0;

    respond = async (config) => {
      if (config.url === '/auth/token/refresh/') {
        refreshPayloads.push(refreshBody(config));
        refreshCount += 1;
        return response(config, refreshCount === 1
          ? { access: 'a1', refresh: 'r1' }
          : { access: 'a2', refresh: 'r2' });
      }

      protectedAuthorizations.push(authorization(config));
      if ((config.url === '/protected/first' && authorization(config) === 'Bearer a1')
        || (config.url === '/protected/second' && authorization(config) === 'Bearer a2')) {
        return response(config, { authorization: authorization(config) });
      }
      return Promise.reject(unauthorized(config));
    };

    const first = await http.get<{ authorization: string }>('/protected/first');
    const second = await http.get<{ authorization: string }>('/protected/second');

    expect(refreshPayloads).toEqual([{ refresh: 'r0' }, { refresh: 'r1' }]);
    expect(protectedAuthorizations).toEqual(['Bearer a0', 'Bearer a1', 'Bearer a1', 'Bearer a2']);
    expect(first.data).toEqual({ authorization: 'Bearer a1' });
    expect(second.data).toEqual({ authorization: 'Bearer a2' });
    expect(Cookies.get('access_token')).toBe('a2');
    expect(Cookies.get('refresh_token')).toBe('r2');
  });

  it('shares one refresh recovery across simultaneous expired requests', async () => {
    // Falla si dos 401 simultáneos gastan el mismo refresh token rotativo dos veces.
    Cookies.set('access_token', 'a0');
    Cookies.set('refresh_token', 'r0');
    const protectedAuthorizations: string[] = [];
    let releaseRefresh: (value: AxiosResponse) => void = () => undefined;
    const refreshStarted = new Promise<void>((resolve) => {
      respond = (config) => {
        if (config.url === '/auth/token/refresh/') {
          resolve();
          return new Promise<AxiosResponse>((release) => {
            releaseRefresh = release;
          });
        }

        protectedAuthorizations.push(authorization(config));
        if (authorization(config) === 'Bearer a1') {
          return Promise.resolve(response(config, { authorization: 'Bearer a1' }));
        }
        return Promise.reject(unauthorized(config));
      };
    });

    const first = http.get<{ authorization: string }>('/protected/first');
    const second = http.get<{ authorization: string }>('/protected/second');
    await refreshStarted;
    releaseRefresh(response(adapter.mock.calls.find(([config]) => config.url === '/auth/token/refresh/')![0], {
      access: 'a1',
      refresh: 'r1',
    }));

    await expect(first).resolves.toMatchObject({ data: { authorization: 'Bearer a1' } });
    await expect(second).resolves.toMatchObject({ data: { authorization: 'Bearer a1' } });
    expect(adapter.mock.calls.filter(([config]) => config.url === '/auth/token/refresh/')).toHaveLength(1);
    expect(protectedAuthorizations).toEqual(['Bearer a0', 'Bearer a0', 'Bearer a1', 'Bearer a1']);
  });

  it('replays a late 401 with the token already stored by another request', async () => {
    // Falla si una respuesta 401 tardía inicia otra renovación después de que otro request rotó el acceso.
    Cookies.set('access_token', 'a0');
    Cookies.set('refresh_token', 'r0');
    const protectedAuthorizations: string[] = [];

    respond = async (config) => {
      if (config.url === '/auth/token/refresh/') {
        throw new Error('refresh route must not be reached');
      }

      protectedAuthorizations.push(authorization(config));
      if (authorization(config) === 'Bearer a0') {
        Cookies.set('access_token', 'a1');
        Cookies.set('refresh_token', 'r1');
        return Promise.reject(unauthorized(config));
      }
      return response(config, { authorization: authorization(config) });
    };

    const result = await http.get<{ authorization: string }>('/protected/late');

    expect(result.data).toEqual({ authorization: 'Bearer a1' });
    expect(protectedAuthorizations).toEqual(['Bearer a0', 'Bearer a1']);
    expect(adapter.mock.calls.filter(([config]) => config.url === '/auth/token/refresh/')).toHaveLength(0);
  });

  it('rejects an expired request without a refresh credential', async () => {
    // Falla si una sesión sin refresh intenta recuperar credenciales inexistentes.
    Cookies.set('access_token', 'a0');
    respond = async (config) => Promise.reject(unauthorized(config));

    await expect(http.get('/protected/no-refresh')).rejects.toMatchObject({ message: 'expired access token' });

    expect(adapter.mock.calls.filter(([config]) => config.url === '/auth/token/refresh/')).toHaveLength(0);
    expect(Cookies.get('access_token')).toBeUndefined();
    expect(Cookies.get('refresh_token')).toBeUndefined();
  });

  it('clears tokens after malformed refresh data', async () => {
    // Falla si una respuesta de renovación incompleta conserva una sesión que ya no puede autenticarse.
    Cookies.set('access_token', 'a0');
    Cookies.set('refresh_token', 'r0');
    respond = async (config) => config.url === '/auth/token/refresh/'
      ? response(config, { access: 'a1', refresh: '' })
      : Promise.reject(unauthorized(config));

    await expect(http.get('/protected/malformed')).rejects.toThrow('Invalid token refresh response');

    expect(adapter.mock.calls.filter(([config]) => config.url === '/auth/token/refresh/')).toHaveLength(1);
    expect(Cookies.get('access_token')).toBeUndefined();
    expect(Cookies.get('refresh_token')).toBeUndefined();
  });

  it('clears tokens after a refresh timeout rejection', async () => {
    // Falla si un timeout de renovación deja credenciales rotas disponibles para nuevas solicitudes.
    Cookies.set('access_token', 'a0');
    Cookies.set('refresh_token', 'r0');
    respond = async (config) => config.url === '/auth/token/refresh/'
      ? Promise.reject(new Error('refresh timeout'))
      : Promise.reject(unauthorized(config));

    await expect(http.get('/protected/timeout')).rejects.toThrow('refresh timeout');

    expect(adapter.mock.calls.filter(([config]) => config.url === '/auth/token/refresh/')).toHaveLength(1);
    expect(Cookies.get('access_token')).toBeUndefined();
    expect(Cookies.get('refresh_token')).toBeUndefined();
  });

  it('rejects a second 401 after one replay', async () => {
    // Falla si el replay de una solicitud expirada entra en un ciclo de renovaciones infinito.
    Cookies.set('access_token', 'a0');
    Cookies.set('refresh_token', 'r0');
    const protectedAuthorizations: string[] = [];
    respond = async (config) => {
      if (config.url === '/auth/token/refresh/') {
        return response(config, { access: 'a1', refresh: 'r1' });
      }
      protectedAuthorizations.push(authorization(config));
      return Promise.reject(unauthorized(config));
    };

    await expect(http.get('/protected/replayed')).rejects.toMatchObject({ message: 'expired access token' });

    expect(adapter.mock.calls.filter(([config]) => config.url === '/auth/token/refresh/')).toHaveLength(1);
    expect(protectedAuthorizations).toEqual(['Bearer a0', 'Bearer a1']);
  });

  it('rejects a network error without request configuration', async () => {
    // Falla si un error de red sin configuración intenta acceder a una solicitud inexistente para renovarla.
    respond = async () => Promise.reject(new AxiosError('network failure'));

    await expect(http.get('/protected/network')).rejects.toMatchObject({ message: 'network failure' });

    expect(adapter.mock.calls.filter(([config]) => config.url === '/auth/token/refresh/')).toHaveLength(0);
  });
});
