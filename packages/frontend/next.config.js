//@ts-check


const { composePlugins, withNx } = require('@nx/next');
const dotenv = require('dotenv');
const path = require('path');

const envName = process.env.NODE_ENV === 'production' ? 'live' : 'dev';
dotenv.config({ path: path.resolve(__dirname, `../../documents/environments/${envName}.env`), override: true });

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  reactStrictMode: false,
  trailingSlash: true,
  transpilePackages: [
    '@bosvault/shared-services',
    '@bosvault/shared-models',
    '@bosvault/backend-utils',
  ],

  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  // Performance Optimizations

  compress: true, // Enable gzip compression
  productionBrowserSourceMaps: false, // Disable source maps in production

  output: 'export',


  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    unoptimized: true
  },

  // Modularize imports disabled temporarily to debug 404s


  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer && process.env.NODE_ENV === 'production') {
      // Optimize chunk splitting
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Recharts vendor chunk
          recharts: {
            test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
            name: 'recharts',
            priority: 10,
            reuseExistingChunk: true,
          },
          // Lucide icons chunk
          lucide: {
            test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
            name: 'lucide-icons',
            priority: 9,
            reuseExistingChunk: true,
          },
          // Common vendor chunk
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 8,
            reuseExistingChunk: true,
          },
          // Common code chunk
          common: {
            minChunks: 2,
            priority: 7,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.APP_AVS_SERVICE_URL || 'https://bosvault.inolyse.live/api/:path*',
      },
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
