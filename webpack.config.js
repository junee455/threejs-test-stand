const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const path = require("path");

const htmlPages = [
  "tweenTest",
  "vpsTest",
  "engineTest",
  "perlinNoise",
  "perlinNoise3D",
  "landing",
  "physics"
];

function generateHtmlTemplates() {
  return htmlPages.map((page) => {
    return new HtmlWebpackPlugin({
      title: page,
      template: `./src/pages/${page}/index.html`,
      cache: false,
      filename: `${page}.html`,
      chunks: [page],
    });
  });
}

function generateEntries() {
  const entries = {};

  htmlPages.forEach((page) => {
    entries[page] = `./src/pages/${page}/index.ts`;
  });

  return entries;
}

module.exports = {
  entry: generateEntries(),
  mode: "development",
  devtool: "inline-source-map",
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  devServer: {
    static: "./dist",
    https: true,
    port: 3000,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|mp4)$/i,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    plugins: [
      new TsconfigPathsPlugin({
        extensions: [".ts", ".js"],
      }),
    ],
  },
  plugins: [
    ...generateHtmlTemplates(),
    new HtmlWebpackPlugin({
      cache: false,
      template: "src/index.html",
      chunks: [],
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: "assets" }],
    }),
  ],
};
