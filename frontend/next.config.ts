import type { NextConfig } from "next";
import { resolveApiBaseUrl } from './lib/apiConfig';

// Dev-only: hosts allowed to fetch /_next/* resources (e.g. the VM IP when the
// browser runs outside the dev machine). Comma-separated, from .env.local.
const devOrigins = (process.env.NEXT_DEV_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// El export estático sólo en el build. En `next dev` haría que /blog/<slug>/ y
// /portafolio/<slug>/ exigieran que cada slug esté en generateStaticParams(),
// y esas dos rutas se sirven con UNA plantilla para todos los slugs: Django la
// entrega y el contenido lo pide el navegador a la API.
const isBuild = process.env.NODE_ENV === 'production';

// Refuse an export that would send a visitor's requests to their own machine.
resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL, isBuild);

const nextConfig: NextConfig = {
  ...(isBuild ? { output: 'export' as const } : {}),
  agentRules: false,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(devOrigins.length ? { allowedDevOrigins: devOrigins } : {}),
};

export default nextConfig;
