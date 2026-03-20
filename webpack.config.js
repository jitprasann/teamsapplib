const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const commonConfig = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
  externals: {
    '@microsoft/teams-js': {
      commonjs: '@microsoft/teams-js',
      commonjs2: '@microsoft/teams-js',
      amd: 'microsoftTeams',
      root: 'microsoftTeams',
    },
  },
  resolve: {
    extensions: ['.js'],
  },
};

// UMD build (unminified + minified)
const umdConfig = {
  ...commonConfig,
  name: 'umd',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'teams.umd.js',
    library: {
      name: 'MicrosoftlibTeams',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
  optimization: {
    minimize: false,
  },
};

const umdMinConfig = {
  ...commonConfig,
  name: 'umd-min',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'teams.umd.min.js',
    library: {
      name: 'MicrosoftlibTeams',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};

// CJS build
const cjsConfig = {
  ...commonConfig,
  name: 'cjs',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'teams.cjs.js',
    library: {
      type: 'commonjs2',
    },
  },
  optimization: {
    minimize: false,
  },
};

// ESM build
const esmConfig = {
  ...commonConfig,
  name: 'esm',
  experiments: {
    outputModule: true,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'teams.esm.js',
    library: {
      type: 'module',
    },
  },
  externals: ['@microsoft/teams-js'],
  optimization: {
    minimize: false,
  },
};

module.exports = [umdConfig, umdMinConfig, cjsConfig, esmConfig];
