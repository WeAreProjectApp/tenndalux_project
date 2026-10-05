/** Keep static exports on the site's API unless a public origin is configured. */
export function resolveApiBaseUrl(configured: string | undefined, production: boolean): string {
  const baseUrl = configured?.trim() || (production ? '/api' : 'http://localhost:8000/api');

  if (production && !(baseUrl.startsWith('/') && !baseUrl.startsWith('//'))) {
    const url = new URL(baseUrl);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    const loopback = hostname === 'localhost' || hostname.endsWith('.localhost')
      || hostname.startsWith('127.') || hostname === '0.0.0.0' || hostname === '[::1]';
    if (url.protocol !== 'https:' || loopback) {
      throw new Error('Production API URL must use a relative path or a public HTTPS origin.');
    }
  }

  return baseUrl;
}
