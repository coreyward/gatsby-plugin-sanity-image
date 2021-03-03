# gatsby-plugin-sanity-image

The well-considered marriage between Sanity’s image assets and Gatsby you’ve
been looking for.

- Outputs a single `<img>` tag, no nested DOM structure to mess with
- Supports low-quality image previews out of the box, without build-time
  penalties
- Generates a `srcSet` automatically based on the `width` you specify _in your
  component code_ (meaning you can change it on the fly!)
- Applies Sanity hotspot data as the `object-position` in case you need it
- Computes cropped dimensions and drops `srcSet` entries that are larger than
  the source dimensions when appropriate (follows Sanity’s image-url parameters)
- Configure image quality, resizing behavior, file format, and more with
  [Sanity’s Image API](https://www.sanity.io/docs/image-urls)

## At a Glance

You can find the full writeup on getting going below, but in the interest of
making it easy to see if this is the thing you are looking for, here’s what
using it looks like:

```jsx
import Image from "gatsby-plugin-sanity-image"

const YourSweetComponent = ({ image }) => (
  <Image
    // pass asset, hotspot, and crop fields
    {...image}
    // tell Sanity how large to make the image (does not set any CSS)
    width={500}
    // style it how you want it
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
    }}
  />
)

export default YourSweetComponent

export const query = graphql`
  {
    sanityDocumentOfSomeKind {
      sweetImage {
        ...ImageWithPreview
      }
    }
  }
`
```

That’s the gist, folks. Read on for the full scoop!

## Getting Started

### Install it

```sh
yarn add gatsby-plugin-sanity-image
```

### Configure it

> ℹ️ **Note**: If this is your first time adding a Gatsby plugin, be sure to
> [read this guide first](https://www.gatsbyjs.com/docs/using-a-plugin-in-your-site/)—the
> below is a shorthand notation.

Simple configuration:

```js
{
  resolve: "gatsby-plugin-sanity-image",
  options: {
    // Sanity project info (required)
    projectId: "abcd1234",
    dataset: "production",
  },
}
```

<details>
  <summary>Expand the full configuration example</summary>

```js
// Full configuration:
{
  resolve: "gatsby-plugin-sanity-image",
  options: {
    // Sanity project info (required)
    projectId: "abcd1234",
    dataset: "production",

    // Additional params to include with every image.
    // This is optional and the default is shown
    // below—if you like what you see, don’t set it.
    defaultImageConfig: {
      quality: 75,
      fit: "max",
      auto: "format",
    },

    // If you prefer a different fragment name, such
    // as `MagicImage`, enter it here. This needs to
    // be unique your GraphQL types. `WithPreview`
    // will be appended for the second fragment (e.g.
    // MagicImageWithPreview).
    fragmentName: "Image",

    // By default, image fields are typed as SanityImage,
    // but there are cases where you might want to use
    // a custom schema or where custom image types are
    // not under the SanityImage type. In this case, you
    // can alter the type that the fragment is defined
    // on here without redefining the fragments.
    fragmentTypeName: "SanityImage",

    // If you prefer to retreive data another way or
    // if you want to define the fragment you use
    // separately, you can opt-out of having fragments
    // included entirely.
    includeFragments: true,

    // This config directive allows you to specify the
    // field that should be retrieved and used as alt
    // text when no `alt` prop is passed to the image
    // component. See docs for more detail.
    altFieldName: "alt",

    // Custom image types are also supported; refer to
    // full documentation for usage instructions.
    customImageTypes: [],
  },
}
```

</details>

Don’t forget to restart `gatsby develop` after you update your
`gatsby-config.js`!

## Usage

1. Query for the image fields
2. Pass the retrieved fields as props to the `SanityImage` component
3. Use it like normal—it's just an `img` tag! 🤯😇

### Querying for image data via GraphQL

This plugin includes two GraphQL fragments that will fetch the fields needed for
display from any Sanity image asset. You do not have to use them, but they are
convenient and help keep you away from confusing bugs.

In most cases, you'll want to use the `ImageWithPreview` fragment:

```graphql
export const query = graphql`
  {
    sanitySomeDocument {
      yourImageField {
        ...ImageWithPreview
      }
    }
  }
`
```

This will retrieve the `asset`, `hotspot`, and `crop` fields and includes a
low-quality image preview that will be shown while the full image is loading.

#### Opting out of blurry preview images

If you have an image that you do NOT want to use the preview image for, you can
opt to use the simpler `Image` fragment instead. This has all of the same fields
with the exception of the preview. This will keep your HTML files a bit lighter,
but you may wind up with more cumulative layout shift as the browser fetches the
image dimensions and evaluates your styles.

Note: If you are using an SVG image, you probably do _not_ want to fetch the
preview since it’ll get thrown away—the `SanityImage` component aborts early on
SVG images to avoid generating meaningless `srcSet` data that reduces cache
efficiency.

### Using the `SanityImage` component

The data you fetched from GraphQL should be an object that you can expand
straight into the `SanityImage` component and just work. If you used the
`ImageWithPreview` fragment, `SanityImage` will do the right thing
automatically.

```jsx
import SanityImage from "gatsby-plugin-sanity-image"

const YourComponent = ({ yourImageFieldData }) =>
  <SanityImage {...yourImageFieldData} width={300} alt="Sweet Christmas!">
```

<details>
  <summary>This renders an image tag like this:</summary>

```html
<!--
  Using {baseUrl} below to refer to a string with this format:
  https://cdn.sanity.io/images/{projectId}/{dataset}/{imageId}?w=300&amp;h=600&amp;q=75&amp;fit=max&amp;auto=format
-->
<img
  src="{baseUrl}"
  srcset="
    {baseUrl}&amp;dpr=0.5  150w,
    {baseUrl}&amp;dpr=0.75 225w,
    {baseUrl}&amp;dpr=1    300w,
    {baseUrl}&amp;dpr=1.5  450w,
    {baseUrl}&amp;dpr=2    600w
  "
  loading="lazy"
  alt="Sweet Christmas!"
  class="css-1jku2jm-SanityImage"
/>
```

</details>

Note that `SanityImage` is not doing anything to style your image based on the
width or height you provide (aside from setting a class with `object-position`
set, should you choose to use it). In practice, it's rare that these values
align consistently with a particular layout, and library control of this makes
it difficult to predict the output given a particular input.

Instead you can style the resulting `img` tag just like any other element.
`SanityImage` will pass through `className` and `style` props, and it makes no
assumptions about your image presentation.

<details>
  <summary><strong>⚠️ Minor gotchas with deferred loading</strong></summary>

`SanityImage` is relying on browser-native deferred image loading. This
generally works fine in browsers that support it, but there are situations where
the unloaded image is hidden or covered, resulting in the full image never
loading.

If this happens, you can override the styles set on the full-size image using
the `img[data-loading]` selector. This image sits immediately adjacent to the
spaceball image and has the following default styles _while loading_:

```css
position: absolute;
width: 10px !important; /* must be > 4px to be lazy loaded */
height: 10px !important; /* must be > 4px to be lazy loaded */
opacity: 0;
zindex: -10;
pointerevents: none;
userselect: none;
```

</details>

## Component Props

For convenience, `__typename`, `_type`, and `_key` props will be ignored. Other
props will be passed through to the final `img` element (e.g. native HTML
attributes).

<sub>\*️⃣ = Required</sub>

| Prop        | Type   | Description                                                                                                                                                                                                |
| ----------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `asset` \*️⃣ | Object | The `asset` object fetched from GraphQL. Should have an `_id` property on it, and possibly `metadata` (if you're using low-quality image previews).                                                        |
| `crop`      | Object | The `crop` values fetched from GraphQL (`top`, `right`, `bottom`, and `left`)                                                                                                                              |
| `hotspot`   | Object | The `hotspot` values fetch from GraphQL (`width`, `height`, `x`, and `y`)                                                                                                                                  |
| `width` \*️⃣ | Number | This will be used as a target value to generate a `srcSet` of images both smaller and larger.                                                                                                              |
| `height`    | Number | Used to further constrain the image. Note: due to [a bug in the `@sanity/image-url` library](https://github.com/sanity-io/image-url/issues/32), setting this will cause `fit` modes to be largely ignored. |
| `config`    | Object | Parameters for `@sanity/image-url`. [Full list here](https://www.sanity.io/docs/image-url).                                                                                                                |
| `options`   | Object | See below.                                                                                                                                                                                                 |

### Options

<details>
  <summary><code>__experimentalAspectRatio</code> (Boolean)</summary>

If enabled, `SanityImage` will attempt to compute the final aspect ratio and use
it to set `width` and `height` attributes on both the low-quality preview image
as well as the final image. This does not currently take into account any
`config` options, including `fit` modes or transforming options like `rect` or
`orientation`.

</details>

## Configuration Directives

<sub>\*️⃣ = Required</sub>

| Option               | Type    | Default         | Description                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | ------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projectId` \*️⃣      | String  |                 | Sanity Project ID                                                                                                                                                                                                                                                                                                                                                                         |
| `dataset` \*️⃣        | String  |                 | Sanity Dataset ID                                                                                                                                                                                                                                                                                                                                                                         |
| `fragmentName`       | String  | `"Image"`       | If you prefer a different fragment name, such as `MagicImage`, enter it here. This needs to be unique your GraphQL types. `WithPreview` will be appended for the second fragment (e.g. MagicImageWithPreview).                                                                                                                                                                            |
| `fragmentTypeName`   | String  | `"SanityImage"` | By default, image fields are typed as SanityImage, but there are cases where you might want to use a custom schema or where custom image types are not under the `SanityImage` type. In this case, you can alter the type that the fragment is defined on without redefining the fragments.                                                                                               |
| `includeFragments`   | Boolean | `true`          | If you prefer to retreive data another way or if you want to define the fragment you use separately, you can opt-out of having fragments included entirely.                                                                                                                                                                                                                               |
| `customImageTypes`   | Array   | `[]`            | If you would like to use the `Image` and `ImageWithPreview` fragments on custom image types, specify all custom type names in the `customImageTypes` array. For more detail, [follow this guide](https://github.com/coreyward/gatsby-plugin-sanity-image/wiki/Custom-Sanity-Image-Types).                                                                                                 |
| `altFieldName`       | String  | `null`          | If you are adding alt text directly to image assets in your Sanity Studio (e.g. via a plugin like [sanity-plugin-media](https://github.com/robinpyon/sanity-plugin-media/)), this plugin can include that field in the `Image` and `ImageWithPreview` fragments and utilize it as the default/fallback `alt` attribute value when no `alt` prop is passed to the `SanityImage` component. |
| `defaultImageConfig` | Object  | See below.      | Additional params to pass to the Sanity image URL builder. These will be converted into function calls against `@sanity/image-url`. [Here is the full list of methods available](https://www.sanity.io/docs/image-url).                                                                                                                                                                   |

The default value for `defaultImageConfig` is as follows:

```js
{
  quality: 75,   // use reasonable lossy compression level
  fit: "max",    // like `object-fit: contain`, but never scaling up
  auto: "format" // automatically select next-gen image formats on supporting browsers
}
```

## More things to know

- If you don't specify `width` the uploaded image width is used.
- You are encouraged to use the `sizes` attribute to steer browsers to select
  the most appropriate image from the `srcSet` based on the viewport width
- You can target the low-quality image preview element via `img[data-lqip]`
  should you want to style it differently

## License

This project is licensed under the Mozilla Public License 2.0, which is a
copyleft license with a share-alike provision. Please contribute meaningful
improvements back to the open-source community, either via direct contribution
or by releasing a separate library!
