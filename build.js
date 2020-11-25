const esbuild = require("esbuild")

const sharedConfig = {
  bundle: true,
  minify: false,
  outdir: ".",
  external: [
    "@emotion/core",
    "@sanity/client",
    "@sanity/image-url",
    "gatsby",
    "prop-types",
    "react",
  ],
}

const handleError = (e) => {
  console.error(e)
  process.exit(1)
}

// Client-side (browser) targeted files
esbuild
  .build({
    ...sharedConfig,
    entryPoints: ["src/index.jsx"],

    // JSX factory is used to support Emotion `css` prop
    jsxFactory: "jsx",

    // Emotion does not provide a Fragment pragma; use named import
    jsxFragment: "Fragment",

    // Target reasonably current browsers
    target: ["chrome84", "firefox80", "safari13.1", "edge85"],

    format: "esm",
  })
  .catch(handleError)

// Server-side build (node) targeted files
esbuild
  .build({
    ...sharedConfig,
    entryPoints: ["src/gatsby-node.js", "src/fragments.js"],
    platform: "node",
  })
  .catch(handleError)
