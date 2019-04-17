const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const CleanWebpackPlugin = require('clean-webpack-plugin');

console.log('NODE_ENV:' + process.env.NODE_ENV);

const prodEntries = {
    index: ['./src/index.ts'],
};

const rootDir = path.resolve(__dirname, '../../');

const outDir = 'dist';
let entries =
    process.env.STAGE === 'prod'
        ? prodEntries
        : {
            ...prodEntries,
            index: [
                'webpack/hot/poll?1000',
                './src/index.ts'
            ]
        };

module.exports = {
    target: 'browser',
    node: {
        __dirname: true,
        __filename: true
    },
    context: __dirname,
    entry: entries,
    externals: [
        nodeExternals({
            whitelist: ['webpack/hot/poll?1000']
        })
    ],
    devtool: 'source-map',
    devServer: {
        hot: true,
        contentBase: path.resolve(__dirname),
        publicPath: '/'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            '~common': path.join(__dirname, '../common/'),
        }
    },
    plugins: [
        new CleanWebpackPlugin([path.resolve(__dirname, outDir)], { root: rootDir }),
        new webpack.DefinePlugin({
            VERSION: JSON.stringify(require('./package.json').version)
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.NamedModulesPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.(pem|txt)$/,
                loader: 'raw-loader',
                exclude: /node_modules/
            },
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            },
            {
                enforce: 'pre',
                test: /\.(js)$/,
                loader: 'eslint-loader',
                exclude: /(node_modules)/
            },
            {
                enforce: 'pre',
                test: /\.(ts)$/,
                loader: 'tslint-loader',
                exclude: /(node_modules)/
            },
            {
                test: /\.(yaml|yml)$/,
                loader: 'json-loader!yaml-loader',
                exclude: /node_modules/
            }
        ]
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, outDir),
        devtoolModuleFilenameTemplate: function (info) {
            return path.resolve(__dirname, encodeURI(info.resourcePath));
        },
        library: '[name]',
        libraryTarget: 'umd'
    }
};
