const path = require('path');
const webpack = require('webpack');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const LoadablePlugin = require('@loadable/webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const cpuLength = require('os').cpus().length;

const STAGE = process.env['NODE_ENV'] || 'development';
const ASSET_PATH =
  process.env.NODE_ENV === 'local'
    ? 'https://localhost:8080/'
    : `https://scinapse-assets.azureedge.net/client-assets/${STAGE}/`;

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: ['@babel/polyfill', './src/client/index.tsx'],
  output: {
    path: path.resolve(__dirname, 'dist', 'assets'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    publicPath: ASSET_PATH,
  },
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
  stats: 'minimal',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@src': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          { loader: 'cache-loader' },
          {
            loader: 'thread-loader',
            options: { workers: cpuLength - 1 },
          },
          {
            loader: 'babel-loader?cacheDirectory=true',
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              happyPackMode: true,
              onlyCompileBundledFiles: true,
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-sprite-loader',
            options: { esModule: false },
          },
          'svg-transform-loader',
          'svgo-loader',
        ],
      },
      {
        test: /\.css$/,
        use: ['isomorphic-style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'isomorphic-style-loader' },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[name]_[local]_[hash:base64:5]',
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => {
                return [require('postcss-flexbugs-fixes'), require('precss'), require('autoprefixer')];
              },
            },
          },
          { loader: 'sass-loader' },
          {
            loader: 'sass-resources-loader',
            options: { resources: ['./src/assets/_variables.scss'] },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.ASSET_PATH': JSON.stringify(ASSET_PATH),
    }),
    new ForkTsCheckerWebpackPlugin({ checkSyntacticErrors: true }),
    new CircularDependencyPlugin({
      exclude: /a\.js|node_modules/,
      failOnError: true,
      allowAsyncCycles: false,
      cwd: process.cwd(),
    }),
    new LoadablePlugin(),
    new webpack.IgnorePlugin(/^\.\/pdf.worker.js$/),
  ],
  devServer: {
    compress: true,
    port: 8080,
    https: true,
    writeToDisk: filePath => {
      return /loadable-stats\.json$/.test(filePath);
    },
  },
};
