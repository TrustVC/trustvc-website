import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'
import type { SanityImage } from '../../types/news'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2025-01-01'
const readToken = import.meta.env.VITE_SANITY_READ_TOKEN
const hasSanityConfig = Boolean(projectId && dataset)

export const sanityClient = hasSanityConfig
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      token: readToken ? String(readToken) : undefined,
    })
  : null

const imageBuilder = hasSanityConfig
  ? createImageUrlBuilder(sanityClient!)
  : null

export const getSanityImageUrl = (source?: SanityImage) => {
  if (!source || !imageBuilder) return null

  return imageBuilder.image(source).auto('format')
}

export const isSanityConfigured = hasSanityConfig
