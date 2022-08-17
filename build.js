const esbuild = require("esbuild")

const handleError = (e) => {
  console.error(e)
  process.exit(1)
}

// Client-side (browser) targeted files
esbuild
  .build({
    bundle: true,
    minify: false,
    entryPoints: ["src/index.jsx"],
    outdir: ".",
    external: [
      "@emotion/react",
      "@sanity/image-url",
      "gatsby",
      "prop-types",
      "react",
    ],

    // JSX factory is used to support Emotion `css` prop
    jsxFactory: "jsx",

    // Emotion does not provide a Fragment pragma; use named import
    jsxFragment: "Fragment",

    // Target reasonably current browsers
    target: ["es2018"],

    format: "esm",
  })
  .catch(handleError)

// Server-side build (node) targeted files
esbuild
  .build({
    bundle: false,
    minify: false,
    entryPoints: ["src/gatsby-node.js"],
    outdir: ".",
    platform: "node",
  })
  .catch(handleError)
