const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
    mode: "development",
    entry: path.resolve(__dirname, "src/index.ts"),

    devServer: {
        port: 3000,
        historyApiFallback: true
    },

    output: {
        publicPath: "auto",
        uniqueName: "shell",
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
            name: "shell",
            remotes: {
                mfA: "mfA@http://localhost:3001/remoteEntry.js",
                mfB: "mfB@http://localhost:3002/remoteEntry.js"
            },
            shared: {
                react: { singleton: true, requiredVersion: false, eager: false },
                "react-dom": { singleton: true, requiredVersion: false, eager: false }
            }
        }),

        new HtmlWebpackPlugin({ template: "public/index.html" })
    ]
};