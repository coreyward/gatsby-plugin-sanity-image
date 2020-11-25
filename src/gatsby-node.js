const fs = require("fs")
const path = require("path")

exports.onPreExtractQueries = ({ store, getNodes }) => {
  // Abort if there are no SanityImage types in the data
  const nodes = getNodes()
  if (!nodes.some((node) => node.internal.type === "SanityImageAsset")) return

  // Add fragments for SanityImage to .cache/fragments
  const { program } = store.getState()
  fs.copyFileSync(
    path.resolve(__dirname, "fragments.js"),
    path.resolve(
      program.directory,
      ".cache/fragments/gatsby-plugin-sanity-image.js"
    )
  )
}

// Make plugin options available to configuration constants
exports.onCreateWebpackConfig = (
  { stage, rules, loaders, plugins, actions },
  { dataset, projectId, useCdn, defaultImageConfig = null }
) => {
  actions.setWebpackConfig({
    plugins: [
      plugins.define({
        __GATSBY_PLUGIN_SANITY_IMAGE__DATASET__: JSON.stringify(dataset),
        __GATSBY_PLUGIN_SANITY_IMAGE__PROJECTID__: JSON.stringify(projectId),
        __GATSBY_PLUGIN_SANITY_IMAGE__USECDN__: JSON.stringify(useCdn),
        __GATSBY_PLUGIN_SANITY_IMAGE__DEFAULT_IMAGE_CONFIG__: JSON.stringify(
          defaultImageConfig
        ),
      }),
    ],
  })
}
