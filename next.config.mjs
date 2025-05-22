// next.config.js
const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: isProd ? '/<repo-name>' : '',
  assetPrefix: isProd ? '/<repo-name>/' : '',
};

export default nextConfig;