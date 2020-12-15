const fs = require("fs").promises
const path = require("path")
const bufferReplace = require("./lib/bufferReplace")

exports.onPreExtractQueries = async (
  { store, getNodes },
  {
    includeFragments = true,
    fragmentName = "Image",
    fragmentTypeName = "SanityImage",
  }
) => {
  // No fragments? No problem.
  if (!includeFragments) return

  // Abort if there are no SanityImage types in the data
  const nodes = getNodes()
  if (!nodes.some((node) => node.internal.type === "SanityImageAsset")) return

  const fragments = await fs
    .readFile(path.resolve(__dirname, "fragments.js"))

    // Substitute customizable fragment name and type
    .then(replaceFragmentName(fragmentName))
    .then(replaceFragmentTypeName(fragmentTypeName))

  const { program } = store.getState()
  const basePath = program.directory

  // Gatsby will pick up fragments defined in this folder
  const fragmentCachePath = path.resolve(
    basePath,
    ".cache/fragments/gatsby-plugin-sanity-image.js"
  )

  return fs.writeFile(fragmentCachePath, fragments)
}

// Make plugin options available to configuration constants
exports.onCreateWebpackConfig = (
  { stage, rules, loaders, plugins, actions },
  { dataset, projectId, useCdn = true, defaultImageConfig = null }
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

const replaceFragmentName = (fragmentName) => (data) =>
  bufferReplace(data, "__FRAGMENT_NAME__", fragmentName)

const replaceFragmentTypeName = (fragmentTypeName) => (data) =>
  bufferReplace(data, "__FRAGMENT_TYPE_NAME__", fragmentTypeName)
