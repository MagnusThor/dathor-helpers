const webpack = require('webpack');

module.exports = {
    mode: "development",
    watch: false,
    entry: {
        "fiddle": "./dist/ExampleApp/MyApp.js",

    },
    output: {
        path: __dirname + "/public/js",
        filename: "[name]-bundle.js"
    },
    plugins: [
    ],
    module: {
    },
    externals: {
    }
}