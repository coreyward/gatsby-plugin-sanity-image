const fs = require("fs").promises
const path = require("path")
const bufferReplace = require("./lib/bufferReplace")

exports.onPreExtractQueries = async (
  { store, getNodes },
  {
    includeFragments = true,
    fragmentName = "Image",
    fragmentTypeName = "SanityImage",
    customImageTypes = [],
    altFieldName,
  }
) => {
  // No fragments? No problem.
  if (!includeFragments) return

  // Abort if there are no SanityImage types in the data
  const nodes = getNodes()
  if (!nodes.some((node) => node.internal.type === "SanityImageAsset")) return

  // If custom image types are provided but the fragment type name
  // hasn't been customized, we need to change it to prevent collision
  // with the `SanityImage` type provided by gatsby-source-sanity.
  if (customImageTypes.length)
    fragmentTypeName =
      fragmentTypeName === "SanityImage"
        ? "SanityImageEntity"
        : fragmentTypeName

  const fragments = await fs
    .readFile(path.resolve(__dirname, "fragments.js"))

    // Substitute customizable fragment name and type
    .then(replaceFragmentName(fragmentName))
    .then(replaceFragmentTypeName(fragmentTypeName))

    // and configure support for alt text on the Asset
    .then(configureAltTextSupport(altFieldName))

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
  { dataset, projectId, altFieldName, useCdn = true, defaultImageConfig = null }
) => {
  actions.setWebpackConfig({
    plugins: [
      plugins.define({
        __GATSBY_PLUGIN_SANITY_IMAGE__DATASET__: JSON.stringify(dataset),
        __GATSBY_PLUGIN_SANITY_IMAGE__PROJECTID__: JSON.stringify(projectId),
        __GATSBY_PLUGIN_SANITY_IMAGE__USECDN__: JSON.stringify(useCdn),
        __GATSBY_PLUGIN_SANITY_IMAGE__ALT_FIELD__: JSON.stringify(altFieldName),
        __GATSBY_PLUGIN_SANITY_IMAGE__DEFAULT_IMAGE_CONFIG__: JSON.stringify(
          defaultImageConfig
        ),
      }),
    ],
  })
}

// Enable fragment support for custom Sanity image types
exports.sourceNodes = (
  { actions: { createTypes } },
  { customImageTypes = [], fragmentTypeName = "SanityImage" }
) => {
  if (!customImageTypes || customImageTypes.length === 0) return

  // If a custom name for the fragment type has been provided, it will
  // be used to declare the interface for all image types
  const interfaceTypeName =
    fragmentTypeName === "SanityImage" ? "SanityImageEntity" : fragmentTypeName

  const imageFields = `
    asset: SanityImageAsset
    hotspot: SanityImageHotspot
    crop: SanityImageCrop
  `

  const typeDefs = ["SanityImage", ...customImageTypes]
    .map(
      (type) =>
        `type ${type} implements ${interfaceTypeName} { ${imageFields} }`
    )
    .join("\n\n")

  createTypes(`
    interface ${interfaceTypeName} {
      ${imageFields}
    }

    ${typeDefs}
  `)
}

const replaceFragmentName = (fragmentName) => (data) =>
  bufferReplace(data, "__FRAGMENT_NAME__", fragmentName)

const replaceFragmentTypeName = (fragmentTypeName) => (data) =>
  bufferReplace(data, "__FRAGMENT_TYPE_NAME__", fragmentTypeName)

const configureAltTextSupport = (altFieldName) => (data) =>
  bufferReplace(data, "__OPTIONAL_ALT_SUPPORT__", altFieldName || "")
