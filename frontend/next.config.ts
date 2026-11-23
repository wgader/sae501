import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

// Adresse de Symfony vue par `next dev` (service `app` de docker-compose.yml).
const devBackendUrl = process.env.DEV_BACKEND_URL ?? 'http://localhost:8000';

const nextConfig: NextConfig = {
  // En production, le site est exporté en fichiers statiques (dossier out/) puis copié dans
  // backend/public : Caddy les sert, et Symfony ne reçoit que /api.
  output: isDev ? undefined : 'export',
  poweredByHeader: false,
  // Pas de serveur Node pour redimensionner les images : elles sont servies telles quelles.
  images: { unoptimized: true },

  // En développement seulement, `next dev` relaie vers Symfony les chemins qu'il ne connaît pas,
  // pour que le code n'appelle jamais que /api/... comme en production.
  ...(isDev && {
    async rewrites() {
      return ['/api/:path*', '/uploads/:path*', '/bundles/:path*'].map((source) => ({
        source,
        destination: `${devBackendUrl}${source}`,
      }));
    },
  }),
};

export default nextConfig;
