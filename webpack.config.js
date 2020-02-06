// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const commonPlugins = [
    new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1, // Must be greater than or equal to one
        minChunkSize: 1000000,
    }),
    // Be warned: this plugin supports tslint, but enabling it here causes webpack to occasionally
    // process.exit(0) in the middle of execution on mac build machines, resulting in difficult to
    // debug build failures. We aren't quite sure why this is yet, but until it's root caused, keep
    // tslint separate from webpack.
    new ForkTsCheckerWebpackPlugin(),
    new CaseSensitivePathsPlugin(),
    new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: '[name].css',
        chunkFilename: '[id].css',
    }),
];

const commonEntryFiles = {
    injected: [path.resolve(__dirname, 'src/injected/stylesheet-init.ts'), path.resolve(__dirname, 'src/injected/client-init.ts')],
    popup: path.resolve(__dirname, 'src/popup/popup-init.ts'),
    insights: [path.resolve(__dirname, 'src/views/insights/initializer.ts')],
    detailsView: [path.resolve(__dirname, 'src/DetailsView/details-view-initializer.ts')],
    background: [path.resolve(__dirname, 'src/background/background-init.ts')],
};

const prodEntryFiles = {
    ...commonEntryFiles,
    devtools: [path.resolve(__dirname, 'src/Devtools/initialize-prod.ts')],
};

const devEntryFiles = {
    ...commonEntryFiles,
    devtools: [path.resolve(__dirname, 'src/Devtools/initialize-dev.ts')],
    debugTools: path.resolve(__dirname, 'src/debug-tools/debug-tools-init.tsx'),
};

const electronEntryFiles = {
    renderer: [path.resolve(__dirname, 'src/electron/views/renderer-initializer.ts')],
    main: [path.resolve(__dirname, 'src/electron/main/main.ts')],
};

const commonConfig = {
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                            experimentalWatchApi: true,
                        },
                    },
                ],
                exclude: ['/node_modules/'],
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            modules: {
                                localIdentName: '[local]--[hash:base64:5]',
                            },
                            localsConvention: 'camelCaseOnly',
                        },
                    },
                    'sass-loader',
                ],
            },
        ],
    },
    resolve: {
        modules: [path.resolve(__dirname, './src'), path.resolve(__dirname, 'node_modules')],
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: commonPlugins,
    node: {
        setImmediate: false,
    },
    performance: {
        // We allow higher-than-normal sizes because our users only have to do local fetches of our bundles
        maxEntrypointSize: 10 * 1024 * 1024,
        maxAssetSize: 10 * 1024 * 1024,
    },
};

const unifiedConfig = {
    ...commonConfig,
    entry: electronEntryFiles,
    name: 'unified',
    mode: 'development',
    devtool: 'source-map',
    output: {
        path: path.join(__dirname, 'extension/unifiedBundle'),
        filename: '[name].bundle.js',
    },
    node: {
        ...commonConfig.node,
        __dirname: false,
        __filename: false,
    },
    optimization: {
        splitChunks: false,
    },
    target: 'electron-main',
};

const devConfig = {
    ...commonConfig,
    entry: devEntryFiles,
    name: 'dev',
    mode: 'development',
    devtool: 'eval-source-map',
    output: {
        path: path.join(__dirname, 'extension/devBundle'),
        filename: '[name].bundle.js',
    },
    optimization: {
        splitChunks: false,
    },
};

const prodConfig = {
    ...commonConfig,
    entry: prodEntryFiles,
    name: 'prod',
    mode: 'production',
    devtool: false,
    output: {
        path: path.join(__dirname, 'extension/prodBundle'),
        filename: '[name].bundle.js',
        pathinfo: false,
    },
    optimization: {
        splitChunks: false,
        minimizer: [
            new TerserWebpackPlugin({
                sourceMap: false,
                terserOptions: {
                    compress: false,
                    mangle: true,
                    output: {
                        ascii_only: true,
                        comments: /^\**!|@preserve|@license|@cc_on/i,
                        beautify: false,
                    },
                },
            }),
        ],
    },
};

const packageReportConfig = {
    entry: {
        report: [path.resolve(__dirname, 'src/reports/package/reporter-factory.ts')],
    },
    module: commonConfig.module,
    externals: [nodeExternals()],
    plugins: commonPlugins,
    resolve: commonConfig.resolve,
    name: 'package-report',
    mode: 'development',
    devtool: false,
    output: {
        path: path.join(__dirname, 'package/report/bundle'),
        filename: '[name].bundle.js',
        pathinfo: false,
        library: '[name]',
        libraryTarget: 'umd',
    },
    target: 'node',
};

// For just one config, use "webpack --config-name dev", "webpack --config-name prod", etc
module.exports = [devConfig, prodConfig, unifiedConfig, packageReportConfig];
