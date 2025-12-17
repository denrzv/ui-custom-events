const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
    mode: "development",
    entry: path.resolve(__dirname, "src/index.ts"),

    devServer: {
        port: 3002,
        historyApiFallback: true,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    },

    output: {
        publicPath: "http://localhost:3002/",
        uniqueName: "mfB",
        clean: true
    },

    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },

    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },

    plugins: [
        new ModuleFederationPlugin({
            name: "mfB",
            filename: "remoteEntry.js",
            exposes: {
                "./WidgetB": "./src/widgetB"
            },
            shared: {
                react: { singleton: true, requiredVersion: false, eager: false },
                "react-dom": { singleton: true, requiredVersion: false, eager: false }
            }
        }),

        new HtmlWebpackPlugin({ template: "public/index.html" })
    ]
};