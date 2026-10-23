import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: '**' },
    ],
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
