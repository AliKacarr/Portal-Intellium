var path = require('path');
const {
  override,
  fixBabelImports,
  addWebpackAlias,
  babelInclude,
  addBabelPlugin,
} = require('customize-cra');
const webpackMajorVersion = Number(
  require('webpack/package.json').version.split('.')[0]
);

// html2pdf / jspdf → fast-png → iobuffer zincirinde tarayıcıda "exports is not defined"
// önlemek için paket kökünü her zaman lib-esm girişlerine yönlendir (CJS lib/*.js kullanılmasın).
const aliasJspdfPngChain = () => (config) => {
  const root = path.resolve(__dirname);
  config.resolve = config.resolve || {};
  const prev = config.resolve.alias || {};
  // jspdf → fast-png → iobuffer: paket içinde dosya adı IOBuffer.js (büyük harf).
  // Eski postinstall yanlışlıkla iobuffer.js oluşturuyordu; webpack IOBuffer.js bekler.
  const iobufferEsm = path.join(root, 'node_modules/iobuffer/lib-esm/IOBuffer.js');
  config.resolve.alias = {
    ...prev,
    'iobuffer$': iobufferEsm,
  };
  return config;
};

// node_modules'dan gelen source map uyarılarını kapat
const disableSourceMapWarnings = () => (config) => {
  const warningPatterns = [
    /Failed to parse source map/,
    /webpack:\/\//,
    /ENOENT: no such file or directory.*\.map/,
  ];

  if (webpackMajorVersion >= 5) {
    config.ignoreWarnings = warningPatterns;
    return config;
  }

  config.stats = {
    ...(typeof config.stats === 'object' && config.stats !== null ? config.stats : {}),
    warningsFilter: warningPatterns,
  };

  return config;
};

const webpackOverride = override(
  babelInclude([path.resolve(__dirname, 'src')]),
  addBabelPlugin('@babel/plugin-transform-class-properties'),
  addBabelPlugin('@babel/plugin-transform-private-methods'),
  addBabelPlugin('@babel/plugin-transform-private-property-in-object'),
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
    style: 'css',
  }),
  addWebpackAlias({
    '@iso/assets': path.resolve(__dirname, 'src/assets'),
    '@iso/components': path.resolve(__dirname, 'src/components'),
    '@iso/config': path.resolve(__dirname, 'src/config'),
    '@iso/containers': path.resolve(__dirname, 'src/containers'),
    '@iso/redux': path.resolve(__dirname, 'src/redux'),
    '@iso/lib': path.resolve(__dirname, 'src/library'),
    '@iso/ui': path.resolve(__dirname, 'src/UI'),
  }),
  disableSourceMapWarnings(),
  aliasJspdfPngChain()
);

const webpackConfig = function (config, env) {
  return webpackOverride(config, env);
};

// ResizeObserver uyarısı overlay'i (zararsız); dev_v2 ile gelen davranış
const devServerConfig = (configFunction) => {
  return function (proxy, allowedHost) {
    const config = configFunction(proxy, allowedHost);
    config.client = {
      ...config.client,
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: (error) => {
          if (
            error?.message?.includes('ResizeObserver loop completed with undelivered notifications') ||
            error?.message?.includes('ResizeObserver loop limit exceeded')
          ) {
            return false;
          }
          return true;
        },
      },
    };
    return config;
  };
};

module.exports = {
  webpack: webpackConfig,
  devServer: devServerConfig,
};
