/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export', // Enable static export
  basePath: isProd ? '/<repo-name>' : '', // GitHub Pages expects this
  assetPrefix: isProd ? '/<repo-name>/' : '', // Needed for CSS/JS assets
};

module.exports = nextConfig;
