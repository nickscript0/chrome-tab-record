const path = require('path');
const WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
    entry: {
        content: './src/content.ts',
        background: './src/background.ts',
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
        publicPath: '/build/'
    },
    // plugins: [
    //     new WebpackNotifierPlugin({ excludeWarnings: true, alwaysNotify: true })
    // ],
	optimization: {
		// We no not want to minimize our code.
		minimize: false
	},    
    devtool: 'source-map',
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            { test: /\.tsx?$/, loader: 'ts-loader' }
        ]
    }
}