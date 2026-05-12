import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'divulgacandcontas.tse.jus.br',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
      },
    ],
  },
  experimental: {
    authInterrupts: true,
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    return [
      {
        source: '/storage/:path*',
        destination: `${apiUrl}/storage/:path*`,
      },
      {
        source: '/metadata/:path*',
        destination: `${apiUrl}/metadata/:path*`,
      },
    ]
  },
}

export default nextConfig
