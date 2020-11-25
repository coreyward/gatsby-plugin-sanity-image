import { graphql } from "gatsby"

export const fragments = graphql`
  fragment Image on SanityImage {
    hotspot {
      height
      width
      x
      y
    }
    crop {
      bottom
      left
      right
      top
    }
    asset {
      _id
    }
  }

  fragment ImageWithPreview on SanityImage {
    ...Image
    asset {
      metadata {
        preview: lqip
      }
    }
  }
`
