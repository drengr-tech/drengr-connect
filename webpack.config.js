const path = require('path');

module.exports = {
  entry: {
    index: path.resolve(__dirname, "dist", "cjs", "index.js"),
  },
  output: {
    path: path.resolve(__dirname, "dist", "umd"),
    filename: "[name].min.js",
    libraryTarget: "umd"
  },
};