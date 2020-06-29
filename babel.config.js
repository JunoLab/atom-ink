let presets = ["@babel/preset-react"];

let plugins = [
    "@babel/plugin-proposal-class-properties"
];

if (process.env.BABEL_ENV === "development") {
    plugins.push("@babel/plugin-transform-modules-commonjs")
}

module.exports = {
    presets: presets,
    plugins: plugins,
    exclude: "node_modules/**",
    sourceMaps: "inline"
}
