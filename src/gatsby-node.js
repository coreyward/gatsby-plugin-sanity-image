const fs = require("fs").promises
const path = require("path")

const fragmentFields = [
  {
    name: "asset",
    type: "SanityImageAsset",
    fields: [
      {
        name: "_id",
        type: "String",
      },
    ],
  },
  {
    name: "hotspot",
    type: "SanityImageHotspot",
    fields: [
      { name: "height", type: "Float" },
      { name: "width", type: "Float" },
      { name: "x", type: "Float" },
      { name: "y", type: "Float" },
    ],
  },
  {
    name: "crop",
    type: "SanityImageCrop",
    fields: [
      { name: "bottom", type: "Float" },
      { name: "left", type: "Float" },
      { name: "right", type: "Float" },
      { name: "top", type: "Float" },
    ],
  },
]

const fieldDefinitionToQuery = ({ name, type, fields }) =>
  fields
    ? `${name} {\n  ${fields.map(fieldDefinitionToQuery).join("\n  ")}\n}`
    : name

const fieldDefinitionToType = ({ name, type, fields }) => `${name}: ${type}`

const mergeFieldDefs = (a, b) => [
  ...a.map((aDef) => {
    const bMatch = b.find((bDef) => bDef.name === aDef.name)
    if (bMatch) {
      return {
        ...bMatch,
        fields:
          aDef.fields && bMatch.fields
            ? mergeFieldDefs(aDef.fields, bMatch.fields)
            : aDef.fields || bMatch.fields,
      }
    }
    return aDef
  }),
  ...b.filter((bDef) => !a.some((aDef) => aDef.name === bDef.name)),
]

exports.onPreExtractQueries = async (
  { store, getNodes },
  {
    includeFragments = true,
    fragmentName = "Image",
    fragmentTypeName = "SanityImage",
    customImageTypes = [],
    customFields = [],
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

  // Merge custom field definitions and asset.<altField> support into field defs
  const _fragmentFields = [
    altFieldName && [
      {
        name: "asset",
        fields: [{ name: altFieldName, type: "String" }],
      },
    ],
    customFields.length && customFields,
  ]
    .filter(Boolean)
    .reduce(
      (output, extensions) => mergeFieldDefs(output, extensions),
      fragmentFields
    )

  const fragments = `
    import { graphql } from "gatsby"

    export const fragments = graphql\`
      fragment ${fragmentName} on ${fragmentTypeName} {
        ${_fragmentFields.map(fieldDefinitionToQuery).join("\n")}
      }

      fragment ${fragmentName}WithPreview on ${fragmentTypeName} {
        ...${fragmentName}
        asset {
          metadata {
            preview: lqip
          }
        }
      }
    \`
  `

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
  {
    dataset,
    projectId,
    altFieldName,
    warnOnMissingAlt = process.env.NODE_ENV === "development",
    emptyAltFallback = false,
    defaultImageConfig = null,
  }
) => {
  actions.setWebpackConfig({
    plugins: [
      plugins.define({
        __GATSBY_PLUGIN_SANITY_IMAGE__DATASET__: JSON.stringify(dataset),
        __GATSBY_PLUGIN_SANITY_IMAGE__PROJECTID__: JSON.stringify(projectId),
        __GATSBY_PLUGIN_SANITY_IMAGE__ALT_FIELD__: JSON.stringify(altFieldName),
        __GATSBY_PLUGIN_SANITY_IMAGE__MISSING_ALT_WARNING__:
          JSON.stringify(warnOnMissingAlt),
        __GATSBY_PLUGIN_SANITY_IMAGE__EMPTY_ALT_FALLBACK__:
          JSON.stringify(emptyAltFallback),
        __GATSBY_PLUGIN_SANITY_IMAGE__DEFAULT_IMAGE_CONFIG__:
          JSON.stringify(defaultImageConfig),
      }),
    ],
  })
}

// Enable fragment support for custom Sanity image types
exports.createSchemaCustomization = (
  { actions: { createTypes } },
  { customImageTypes = [], customFields = [], fragmentTypeName = "SanityImage" }
) => {
  if (!customImageTypes || customImageTypes.length === 0) return

  // If a custom name for the fragment type has been provided, it will
  // be used to declare the interface for all image types
  const interfaceTypeName =
    fragmentTypeName === "SanityImage" ? "SanityImageEntity" : fragmentTypeName

  // Merge custom fields with core field definitions to make them available
  // across all custom types for usage within global image fragments
  const imageFields = mergeFieldDefs(fragmentFields, customFields)
    .map(fieldDefinitionToType)
    .join("\n")

  const typeDefs = ["SanityImage", ...customImageTypes]
    .map(
      (type) =>
        `type ${type} implements ${interfaceTypeName} {\n${imageFields}\n}`
    )
    .join("\n\n")

  createTypes(`
    interface ${interfaceTypeName} {
      ${imageFields}
    }

    ${typeDefs}
  `)
}
