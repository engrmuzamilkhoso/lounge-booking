import type { NextConfig } from 'next';

/**
 * Cache Components is deliberately off: most pages depend on the signed-in user (booking flow,
 * account, admin), and the classic model keeps them simple — pages that read the session
 * cookie render per request, everything else is prerendered automatically.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
