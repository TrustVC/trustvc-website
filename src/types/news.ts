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
  image?: SanityImage
}

export interface SanityCategory {
  title?: string
}

export interface PortableTextSpan {
  _type?: string
  _key?: string
  text?: string
  marks?: string[]
}

export interface PortableTextMarkDef {
  _key?: string
  _type?: string
  href?: string
}

export interface PortableTextBlock {
  _type?: string
  _key?: string
  children?: PortableTextSpan[]
  markDefs?: PortableTextMarkDef[]
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
