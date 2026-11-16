import type { NextConfig } from "next";

// Seules les images de l'API sont optimisées : un motif ouvert ferait de /_next/image un proxy
// capable de télécharger n'importe quelle image d'Internet.
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost');
const isDev = process.env.NODE_ENV === 'development';

/**
 * Politique de sécurité du site (sans nonce : les pages restent pré-rendues). Aucun script ni
 * aucune ressource externe ; les appels et images ne visent que le site et l'API. En
 * développement, React a besoin d'eval et le rechargement à chaud d'une WebSocket.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${apiUrl.origin}`,
  "font-src 'self'",
  `connect-src 'self' ${apiUrl.origin}${isDev ? ' ws:' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(apiUrl.protocol === 'https:' ? ['upgrade-insecure-requests'] : []),
].join('; ');

const nextConfig: NextConfig = {
  output: 'standalone',
  // N'annonce pas la technologie du serveur (en-tête X-Powered-By).
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: apiUrl.protocol === 'https:' ? 'https' : 'http', hostname: apiUrl.hostname },
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: [{ key: 'Content-Security-Policy', value: contentSecurityPolicy }] }];
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/admin/inscriptions', destination: '/admin/inscription', permanent: true },
      { source: '/admin/inscriptions/:id', destination: '/admin/inscription/:id', permanent: true },
      { source: '/admin/associations', destination: '/admin/association', permanent: true },
      { source: '/admin/salles', destination: '/admin/salle', permanent: true },
      { source: '/admin/subventions', destination: '/admin/subvention', permanent: true },
      { source: '/admin/module', destination: '/admin/association', permanent: true },
      { source: '/admin/modules', destination: '/admin/association', permanent: true },
      { source: '/admin/agents', destination: '/admin/agent', permanent: true },
    ];
  },
};

export default nextConfig;
