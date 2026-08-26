/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize images
  images: {
    domains: ['avatars.githubusercontent.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Compress output
  compress: true,

  // Enable SWC minification
  swcMinify: true,

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            // The path holds the id that grants edit access to a CV, so it
            // must never leave the origin. "strict-" also drops it on an
            // HTTPS -> HTTP downgrade.
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/(.*).svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*).png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  },


  // Reduce bundle size by excluding source maps in production
  productionBrowserSourceMaps: false,

  // PoweredByHeader removes the X-Powered-By header
  poweredByHeader: false,
}

module.exports = nextConfig