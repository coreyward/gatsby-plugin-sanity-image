import { graphql } from "gatsby"

export const fragments = graphql`
  fragment __FRAGMENT_NAME__ on __FRAGMENT_TYPE_NAME__ {
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
      __OPTIONAL_ALT_SUPPORT__
    }
  }

  fragment __FRAGMENT_NAME__WithPreview on __FRAGMENT_TYPE_NAME__ {
    ...__FRAGMENT_NAME__
    asset {
      metadata {
        preview: lqip
      }
    }
  }
`
