// @jsx jsx
import { jsx } from "@emotion/react"
import { Fragment, useEffect, useRef, useState } from "react"
import PropTypes from "prop-types"
import sanityImageUrl from "@sanity/image-url"

export const SANITY_REF_PATTERN = /^image-([a-f\d]+)-(\d+x\d+)-(\w+)$/

export const DEFAULT_IMAGE_CONFIG =
  __GATSBY_PLUGIN_SANITY_IMAGE__DEFAULT_IMAGE_CONFIG__ || {
    auto: "format",
    fit: "max",
    quality: 75,
  }

export const builder = sanityImageUrl({
  baseUrl: __GATSBY_PLUGIN_SANITY_IMAGE__BASE_URL__,
  dataset: __GATSBY_PLUGIN_SANITY_IMAGE__DATASET__,
  projectId: __GATSBY_PLUGIN_SANITY_IMAGE__PROJECTID__,
})

/**
 * @typedef {object} SanityImageOptions
 * @prop {boolean} __experimentalAspectRatio If set, `width` and `height` attributes are computed and set on the image based on the aspect ratio. Depending on the configuration used, these dimensions might not match the final image.
 */

/**
 * Builds an <img> tag with the relevant properties from Sanity image data.
 *
 * @param {object} props
 * @param {object} props.asset Object with either an `_id` or a `_ref` property representing the Sanity.io image `_id` and optionally metadata with a base-64 encoded preview image.
 * @param {object} [props.hotspot] Image hotspot (focal point) data from Sanity
 * @param {object} [props.crop] Image crop data from Sanity
 * @param {object} [props.config] Optional configuration overrides passed to the Sanity image url builder
 * @param {number} props.width Anticipated presentation width of the image. This is included in the parameters in the image url, and is used in determining the dimensions for the srcset entries
 * @param {number} [props.height] Desired presentation height of the image. THis is included in the parameters in the image url, and used in determining the aspect ratio in some cases.
 * @param {import("react").HTMLAttributes['className']} [props.className] HTML Attribute passed through to the <img> tag
 * @param {import("react").ImgHTMLAttributes['width']} [props.htmlWidth] HTML Attribute passed through to the <img> tag without any changes
 * @param {import("react").ImgHTMLAttributes['height']} [props.htmlHeight] HTML Attribute passed through to the <img> tag without any changes
 * @param {import("react").ImgHTMLAttributes['alt']} [props.alt] HTML Attribute passed through to the <img> tag without any changes
 * @param {import("react").ImgHTMLAttributes['sizes']} [props.sizes] HTML Attribute passed through to the <img> tag without any changes
 * @param {import("react").ImgHTMLAttributes['crossOrigin']} [props.crossOrigin] HTML Attribute passed through to the <img> tag without any changes
 * @param {import("react").ImgHTMLAttributes['decoding']} [props.decoding] HTML Attribute passed through to the <img> tag without any changes
 * @param {import("react").ImgHTMLAttributes['loading']} [props.loading] HTML Attribute passed through to the <img> tag without any changes
 * @param {import("react").ImgHTMLAttributes['referrerPolicy']} [props.referrerPolicy] HTML Attribute passed through to the <img> tag without any changes
 * @param {import("react").ImgHTMLAttributes['role']} [props.role] HTML Attribute passed through to the <img> tag without any changes
 * @param {import("react").ImgHTMLAttributes['srcSet']} [props.srcSet] HTML Attribute passed through to the <img> tag without any changes
 * @param {import("react").ImgHTMLAttributes['useMap']} [props.useMap] HTML Attribute passed through to the <img> tag without any changes
 * @param {*} [props.__typename] Ignored property for improved ergonomics
 * @param {*} [props._type] Ignored property for improved ergonomics
 * @param {*} [props._key] Ignored property for improved ergonomics
 * @param {*} [props.sources] Reserved (but ignored) property. May be used in the future.
 * @param {SanityImageOptions} [props.options]
 */
const SanityImage = ({
  asset,
  hotspot,
  crop,
  width,
  height,
  options = {},
  config = {},

  // Swallowing these params for convenience
  __typename,
  _type,
  _key,

  // TODO: Support art-direction via <picture> and <source>
  sources,

  ...props
}) => {
  if (!asset) throw new Error("No `asset` prop was passed to `SanityImage`.")

  const preview = asset.metadata?.preview || asset.metadata?.lqip

  // Fallback to asset.<alt> if no `alt` prop provided, if configured
  if (__GATSBY_PLUGIN_SANITY_IMAGE__ALT_FIELD__) {
    props.alt = props.alt ?? asset[__GATSBY_PLUGIN_SANITY_IMAGE__ALT_FIELD__]
  }

  // Warn if no `alt` prop provided for image (direct or via asset.<alt>)
  if (
    __GATSBY_PLUGIN_SANITY_IMAGE__MISSING_ALT_WARNING__ &&
    (typeof props.alt === "undefined" || props.alt === null)
  )
    logImage(
      asset._id || asset._ref,
      `No alt attribute supplied for SanityImage asset: ${
        asset._id || asset._ref
      }`
    )

  if (__GATSBY_PLUGIN_SANITY_IMAGE__EMPTY_ALT_FALLBACK__) {
    props.alt = props.alt ?? ""
  }

  // Rebuild `asset` with only the properties needed for the image
  asset = {
    _id: asset._id || asset._ref,
    hotspot,
    crop,
  }

  // Short circuit for SVG images
  if (parseImageRef(asset._id).format === "svg") {
    return <img src={imageUrl(asset)} {...props} />
  }

  // Create default src and build srcSet
  const src = buildSrc(asset, { ...config, width, height })
  const srcSet = buildSrcSet(asset, { ...config, width, height })

  if (options.__experimentalAspectRatio) {
    // If enabled, this will estimate the final aspect ratio based on
    // the dimensions of the original image and the crop parameter,
    // then use this aspect ratio to apply `width` and `height` attrs
    // to both the preview and final images.
    //
    // Note: No attempts are made to compensate for the `fit` mode or
    // image params that transform the final output dimensions in this
    // early proof-of-concept version.
    const { dimensions } = parseImageRef(asset._id)

    // Short circuit if both width and height are set. This will result
    // in the final aspect ratio matching the aspect ration of the
    // provided width and height props, ignoring the image dimensions.
    //
    // This relies on a bug in the @sanity/image-url library that
    // results in images being cropped with fit modes where they
    // should not be.
    if (width && height) {
      props.width = width
      props.height = height
    } else {
      // If `crop` isn't set, use fallback values.
      crop = crop || { left: 0, right: 0, top: 0, bottom: 0 }

      const croppedWidth = dimensions.width * (1 - crop.left - crop.right)
      const croppedHeight = dimensions.height * (1 - crop.top - crop.bottom)
      const ratio = croppedWidth / croppedHeight

      props.width = width || dimensions.width
      props.height = Math.round(props.width / ratio)
    }
  }

  if (props.htmlWidth) props.width = props.htmlWidth
  if (props.htmlHeight) props.height = props.htmlHeight

  const Image = preview ? ImageWithPreview : "img"

  return (
    <Image
      preview={preview}
      src={src}
      srcSet={srcSet}
      css={
        hotspot && {
          objectPosition: [hotspot.x, hotspot.y]
            .map((value) => (value * 100).toFixed(2) + "%")
            .join(" "),
        }
      }
      loading="lazy"
      {...props}
    />
  )
}

export default SanityImage

const buildSrc = (asset, { width, height, ...config }) => {
  const { dimensions } = parseImageRef(asset._id)

  const origRatio = dimensions.width / dimensions.height
  width = width || dimensions.width
  height = height || Math.round(width / origRatio)

  return imageUrl(asset, { ...config, width, height })
}

const buildSrcSet = (asset, config) => {
  const { dimensions } = parseImageRef(asset._id)
  const fitMode = config.fit || DEFAULT_IMAGE_CONFIG.fit

  // Determine dimensions and ratios for srcSet calculations
  const origRatio = dimensions.width / dimensions.height
  const width = config.width || dimensions.width
  const height = config.height || Math.round(width / origRatio)
  const targetRatio = width / height
  let cropRatio = origRatio
  let maxWidth = dimensions.width
  let maxHeight = dimensions.height

  // Compensate for dimensional changes if image was cropped in Sanity
  if (asset.crop && Object.values(asset.crop).some((n) => n > 0)) {
    const cropWidth =
      dimensions.width -
      asset.crop.left * dimensions.width -
      asset.crop.right * dimensions.width
    const cropHeight =
      dimensions.height -
      asset.crop.top * dimensions.height -
      asset.crop.bottom * dimensions.height

    cropRatio = cropWidth / cropHeight
    if (cropRatio > origRatio) {
      maxHeight = cropHeight
    } else {
      maxWidth = cropWidth
    }
  }

  return Object.values(
    [0.5, 0.75, 1, 1.5, 2].reduce((set, dpr) => {
      const url = imageUrl(asset, { ...config, dpr })
      const size = Math.round(
        // For modes where Sanity will not scale up, determine
        // the anticipated final width based on the params
        ["fillmax", "max", "min"].includes(fitMode)
          ? targetRatio < origRatio
            ? Math.min(
                (maxHeight / (height * dpr)) * (width * dpr),
                width * dpr
              )
            : Math.min(width * dpr, maxWidth)
          : width * dpr
      )

      // Avoid duplicate sizes in srcSet list
      if (!set.size) {
        set[size] = `${url} ${size}w`
      }
      return set
    }, {})
  )
}

const ImageWithPreview = ({ preview, ...props }) => {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef()

  const onLoad = () => {
    setLoaded(true)
  }

  useEffect(() => {
    if (ref.current && ref.current.complete) {
      onLoad()
    }
  })

  return (
    <>
      {!loaded && (
        <img
          src={preview}
          alt={props.alt}
          id={props.id}
          className={props.className}
          style={props.style}
          width={props.width}
          height={props.height}
          data-lqip
        />
      )}
      <img
        ref={ref}
        onLoad={onLoad}
        css={
          !loaded && {
            // Cannot use negative x or y values, visibility: hidden, or display: none
            // to hide or the image might not get loaded.
            position: "absolute",
            width: "10px !important", // must be > 4px to be lazy loaded
            height: "10px !important", // must be > 4px to be lazy loaded
            opacity: 0,
            zIndex: -10,
            pointerEvents: "none",
            userSelect: "none",
          }
        }
        data-loading={loaded ? null : true}
        {...props}
      />
    </>
  )
}

ImageWithPreview.propTypes = {
  preview: PropTypes.string.isRequired,
  src: PropTypes.string.isRequired,
  alt: __GATSBY_PLUGIN_SANITY_IMAGE__ALT_FIELD__
    ? PropTypes.string
    : PropTypes.string.isRequired,
  id: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  width: PropTypes.number,
  height: PropTypes.number,
}

SanityImage.propTypes = {
  config: PropTypes.object,
  options: PropTypes.shape({
    __experimentalAspectRatio: PropTypes.bool,
  }),

  hotspot: PropTypes.shape({
    height: PropTypes.number,
    width: PropTypes.number,
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  crop: PropTypes.shape({
    bottom: PropTypes.number,
    left: PropTypes.number,
    right: PropTypes.number,
    top: PropTypes.number,
  }),
  asset: PropTypes.oneOfType([
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      metadata: PropTypes.shape({
        preview: PropTypes.string,
        lqip: PropTypes.string,
      }),
    }),
    PropTypes.shape({
      _ref: PropTypes.string.isRequired,
      metadata: PropTypes.shape({
        preview: PropTypes.string,
        lqip: PropTypes.string,
      }),
    }),
  ]).isRequired,

  // These are only used for determining the dimensions of the generated
  // assets, not for layout. Use CSS to specify how the browser should
  // render the image instead.
  width: PropTypes.number,
  height: PropTypes.number,

  // These will be passed through to the <img> tag without any changes
  htmlWidth: PropTypes.number,
  htmlHeight: PropTypes.number,
  crossOrigin: PropTypes.string,
  decoding: PropTypes.string,
  loading: PropTypes.string,
  referrerPolicy: PropTypes.string,
  role: PropTypes.string,
  srcSet: PropTypes.string,
  useMap: PropTypes.string,

  // Default React Element Props
  alt: __GATSBY_PLUGIN_SANITY_IMAGE__ALT_FIELD__
    ? PropTypes.string
    : PropTypes.string.isRequired,
  className: PropTypes.string,
  sizes: PropTypes.string,

  // Swallow these non-HTML props instead of passing through to img
  __typename: PropTypes.any,
  _type: PropTypes.any,
  _key: PropTypes.any,
  sources: PropTypes.any,
}

export const parseImageRef = (id) => {
  try {
    const [, assetId, dimensions, format] = SANITY_REF_PATTERN.exec(id)
    const [width, height] = dimensions.split("x").map((v) => parseInt(v, 10))

    return {
      assetId,
      dimensions: { width, height },
      format,
    }
  } catch {
    throw new Error(`Could not parse image ID "${id}"`)
  }
}

export const imageUrl = (asset, params = {}) =>
  Object.entries({ ...DEFAULT_IMAGE_CONFIG, ...params })
    .reduce(
      (acc, [key, value]) =>
        value
          ? Array.isArray(value)
            ? acc[key](...value)
            : acc[key](value)
          : acc,
      builder.image(asset)
    )
    .url()

const logImage = (assetId, message) => {
  const previewImage = imageUrl(
    { _id: assetId },
    { ...DEFAULT_IMAGE_CONFIG, width: 60, height: 60 }
  )

  console.log(
    `%c %c${message}`,
    `
      background: url("${previewImage}") no-repeat;
      background-size: contain;
      padding: calc((30px - 1em) / 2) 15px;
    `.replace(/\n+/g, " "),

    `padding-left: 20px`
  )
}
