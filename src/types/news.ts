export interface SanitySlug {
  current?: string
}

export interface SanityImageAssetRef {
  _ref?: string
}

export interface SanityImage {
  asset?: SanityImageAssetRef
}

export interface SanityAuthor {
  name?: string
}

export interface SanityCategory {
  title?: string
}

export interface PortableTextSpan {
  _type?: string
  text?: string
}

export interface PortableTextBlock {
  _type?: string
  children?: PortableTextSpan[]
}

export interface NewsArticle {
  _id: string
  title: string
  subtitle?: string
  featured?: boolean
  slug: SanitySlug
  mainImage?: SanityImage
  publishedAt?: string
  updatedAt?: string
  source?: string
  body?: PortableTextBlock[]
  author?: SanityAuthor
  categories?: SanityCategory[]
}
