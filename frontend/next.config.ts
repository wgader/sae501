import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      { source: '/admin/inscriptions', destination: '/admin/inscription', permanent: true },
      { source: '/admin/inscriptions/:id', destination: '/admin/inscription/:id', permanent: true },
      { source: '/admin/associations', destination: '/admin/association', permanent: true },
      { source: '/admin/salles', destination: '/admin/salle', permanent: true },
      { source: '/admin/subventions', destination: '/admin/subvention', permanent: true },
      { source: '/admin/modules', destination: '/admin/module', permanent: true },
      { source: '/admin/agents', destination: '/admin/agent', permanent: true },
    ];
  },
};

export default nextConfig;
