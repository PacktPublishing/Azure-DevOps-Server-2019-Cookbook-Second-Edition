const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const fs = require("fs");

module.exports = {
    mode: "development",
    target: "web",
    entry: {
        main: "./src/main.ts",
        generateTestCase: "./src/generateTestCase.ts"
    },
    output: {
        filename: "src/[name].js",
        libraryTarget: "amd",
        devtoolModuleFilenameTemplate: "webpack:///[absolute-resource-path]"
    },
    node: {
        fs: "empty"
    },
    externals: [
        /^VSS\/.*/, /^TFS\/.*/, /^q$/
    ],
    devtool: "inline-source-map",
    devServer: {
        https: true,
        disableHostCheck: true
    },
    resolve: {
        extensions: [
            "*",
            ".webpack.js",
            ".web.js",
            ".ts",
            ".tsx",
            ".js"
        ],
        modules: [
            "node_modules",
            path.resolve(__dirname, "src")
        ],
    },
    module: {
        rules: [
            {
                enforce: "pre",
                loader: "tslint-loader",
                test: /\.tsx?$/,
                options: {
                    emitErrors: true,
                    failOnHint: true
                }
            },
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            },
            {
                test: /\.s?css$/,
                loaders: ["style", "css", "sass"]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(['dist']),
        new CopyWebpackPlugin([
            { from: "./src/*.html", to: "./" },
            { from: "./readme.md", to: "./" },
            { from: "./lib", to: "lib" },
            { from: "./images", to: "images" },
            { from: "./vss-extension.json", to: "vss-extension.json" }
        ])
    ]
}