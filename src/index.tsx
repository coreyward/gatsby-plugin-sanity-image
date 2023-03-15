import React from "react"
import { SanityImage } from "sanity-image"
import type { DirectQueryParams } from "sanity-image/dist/types"

declare var __GATSBY_PLUGIN_SANITY_IMAGE__BASE_URL__: string | undefined
declare var __GATSBY_PLUGIN_SANITY_IMAGE__DATASET__: string | undefined
declare var __GATSBY_PLUGIN_SANITY_IMAGE__PROJECTID__: string | undefined
declare var __GATSBY_PLUGIN_SANITY_IMAGE__ALT_FIELD__: string | undefined
declare var __GATSBY_PLUGIN_SANITY_IMAGE__DEFAULT_IMAGE_CONFIG__:
  | DirectQueryParams
  | undefined
declare var __GATSBY_PLUGIN_SANITY_IMAGE__EMPTY_ALT_FALLBACK__:
  | string
  | undefined

const DEFAULT_IMAGE_CONFIG =
  __GATSBY_PLUGIN_SANITY_IMAGE__DEFAULT_IMAGE_CONFIG__
const dataset = __GATSBY_PLUGIN_SANITY_IMAGE__DATASET__
const projectId = __GATSBY_PLUGIN_SANITY_IMAGE__PROJECTID__
const baseUrl =
  __GATSBY_PLUGIN_SANITY_IMAGE__BASE_URL__ ||
  `https://cdn.sanity.io/images/${projectId}/${dataset}/`

type GatsbySanityImageProps = Omit<
  React.ComponentPropsWithoutRef<typeof SanityImage>,
  "id" | "baseUrl" | "dataset" | "projectId"
> & {
  asset: {
    _id?: string
    _ref?: string
    metadata?: {
      preview?: string
      lqip?: string
    }
    [key: string]: any
  }
}

const GatsbySanityImage = ({ asset, ...props }: GatsbySanityImageProps) => {
  if (!asset) throw new Error("No `asset` prop was passed to `SanityImage`.")

  const { _id, _ref, metadata } = asset
  const id = _id || _ref
  const preview = metadata?.preview || metadata?.lqip

  if (!id)
    throw new Error("No `_id` or `_ref` was found on `SanityImage` `asset`.")

  // Fallback to asset.<alt> if no `alt` prop provided, if configured
  if (__GATSBY_PLUGIN_SANITY_IMAGE__ALT_FIELD__) {
    props.alt = props.alt ?? asset[__GATSBY_PLUGIN_SANITY_IMAGE__ALT_FIELD__]
  }

  if (__GATSBY_PLUGIN_SANITY_IMAGE__EMPTY_ALT_FALLBACK__) {
    props.alt = props.alt ?? ""
  }

  return (
    <SanityImage
      id={id}
      baseUrl={baseUrl}
      preview={preview}
      queryParams={DEFAULT_IMAGE_CONFIG}
      {...props}
    />
  )
}

export default GatsbySanityImage
