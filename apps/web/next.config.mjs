import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  },
  experimental: {
    optimizePackageImports: ['otplib'],
  },
  async headers() {
    const security = [
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    ];
    return [
      // Assets Next : cache OK (perf navigation)
      {
        source: '/_next/static/:path*',
        headers: [...security, { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Pages app : pas de cache agressif (discrétion), sans casser le JS
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [...security, { key: 'Cache-Control', value: 'private, no-cache' }],
      },
    ];
  },
};

export default nextConfig;
