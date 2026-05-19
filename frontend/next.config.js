/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
      },
    ],
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiBase}/uploads/:path*`,
      },
    ];
  },
  // Security & SEO headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // SEO: tell search engines about content type
          { key: 'X-Robots-Tag', value: 'all' },
        ],
      },
      // Classroom routes: allow camera/mic for WebRTC
      {
        source: '/classroom/:path*',
        headers: [
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self)' },
        ],
      },
      {
        source: '/visualizations/:path*',
        headers: [
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self)' },
        ],
      },
      // XML sitemap content type
      {
        source: '/sitemap.xml',
        headers: [{ key: 'Content-Type', value: 'application/xml; charset=utf-8' }],
      },
    ];
  },
};

module.exports = nextConfig;
