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
  resolve: {
    fallback: {
      assert: false,
      // buffer: require.resolve('buffer'),
      // console: require.resolve('console-browserify'),
      // constants: require.resolve('constants-browserify'),
      crypto: require.resolve('crypto-browserify'),
      // domain: require.resolve('domain-browser'),
      // events: require.resolve('events'),
      http: false,
      https: false,
      os: false,
      // path: require.resolve('path-browserify'),
      // punycode: require.resolve('punycode'),
      // process: require.resolve('process/browser'),
      // querystring: require.resolve('querystring-es3'),
      stream: false,
      // string_decoder: require.resolve('string_decoder'),
      // sys: require.resolve('util'),
      // timers: require.resolve('timers-browserify'),
      // tty: require.resolve('tty-browserify'),
      url: false,
      util: false,
      // vm: require.resolve('vm-browserify'),
      // zlib: require.resolve('browserify-zlib'),
    },
  },
};