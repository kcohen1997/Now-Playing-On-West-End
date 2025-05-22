const isProd = process.env.NODE_ENV === 'production';

export default {
  output: 'export',
  basePath: isProd ? '/current-broadway-show-list' : '',
  assetPrefix: isProd ? '/current-broadway-show-list/' : '',
};
