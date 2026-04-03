import type { RefObject } from 'react'

export interface SanitySlug {
  current: string
}

export interface SanityImageAssetRef {
  _ref: string
}

export interface SanityImage {
  asset: SanityImageAssetRef
}

export interface SanityAuthor {
  name: string
  image?: SanityImage
}

export interface SanityCategory {
  title: string
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
  style?: string
  listItem?: string
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

export type NewsDetailHookResult = {
  article: NewsArticle | null
  nextArticle: NewsArticle | null
  loading: boolean
  subtitleText: string
  articleImageUrl: string | null
  nextArticleImageUrl: string | null
  authorImageUrl: string | null
  publishedDateLabel: string
  updatedDateLabel: string | null
  showUpdatedDate: boolean
  articleReadTime: string
  nextArticleReadTime: string
  nextPublishedDateLabel: string
}

export type NewsListHookResult = {
  articles: NewsArticle[]
  loading: boolean
  isLoadingMore: boolean
  featuredArticle: NewsArticle | null
  featuredImageUrl: string | null
  articleGrid: NewsArticle[]
  visibleArticles: NewsArticle[]
  hasMoreArticles: boolean
  loadMoreAnchorRef: RefObject<HTMLDivElement | null>
  getReadTimeText: (body?: NewsArticle['body']) => string
}
