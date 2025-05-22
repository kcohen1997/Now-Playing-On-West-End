// ✅ next.config.js (CommonJS)
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  basePath: isProd ? '/current-broadway-show-list' : '',
  assetPrefix: isProd ? '/current-broadway-show-list/' : '',
};

module.exports = nextConfig;
