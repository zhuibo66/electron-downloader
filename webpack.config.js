const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const getAbsolutePath = (relativePath) => {
  return path.resolve(__dirname, relativePath);
};
const isDevelopment = process.env.NODE_ENV === "development";
module.exports = {
  mode: isDevelopment ? "development" : "production",
  entry: "./ipcRenderer/index.tsx",
  // 这么神奇，把target去掉后，热加载生效了，不理解了。
  // 在target中加入web和es5后，热更新失效，兼容ie9了
  target: ["web", "es5"],

  // 选择一种 source map 格式来增强调试过程
  // https://webpack.docschina.org/configuration/devtool/#development
  devtool: isDevelopment ? "eval-cheap-module-source-map" : false,

  // 是否将注释剥离到单独的文件中
  // https://webpack.docschina.org/plugins/terser-webpack-plugin/#extractcomments
  optimization: {
    minimize: true, //开启压缩后，实例化类导出后，constructor.name会变成字母，而不是本身了，所以要注意了，关闭后则不会出现
    minimizer: [
      new TerserPlugin({
        extractComments: false, //不将注释提取到单独的文件中
      }),
    ],
  },

  resolve: {
    // 要解析的文件的扩展名
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    alias: {
      "@": getAbsolutePath("ipcRenderer"),
    },
  },
  output: {
    path: getAbsolutePath("build"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.(le|c)ss$/,
        use: ["style-loader", "css-loader", "less-loader"],
      }, //less的loader
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/, //配置要处理的文件格式，一般使用正则表达式匹配
        exclude: /node_modules/,
        // loader: require.resolve("babel-loader"), //使用的加载器名称
        // exclude: /node_modules/,
        // options: {
        // presets: ["@babel/preset-react"],
        use: [
          {
            loader: require.resolve("babel-loader"),
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    useBuiltIns: "usage",
                    corejs: 3,
                    loose: false,
                  },
                ],
                ["@babel/preset-react"],
                ["@babel/preset-typescript"],
              ],
              plugins: [
                [
                  "@babel/plugin-proposal-decorators",
                  {
                    legacy: true,
                  },
                ],
              ],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html", //指定模板路径
      filename: "index.html", //指定文件名
      minify: false, //关闭压缩
    }),
  ],
  devServer: {
    open: true,
    port: 8080,
    hot: true,
  },
};
