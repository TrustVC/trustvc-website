import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

const requireEnv = (value: string | undefined, name: 'projectId' | 'dataset') => {
  if (!value) {
    throw new Error(`Missing Sanity ${name} environment variable`)
  }

  return value
}

const projectId = requireEnv(import.meta.env.SANITY_STUDIO_PROJECT_ID, 'projectId')
const dataset = requireEnv(import.meta.env.SANITY_STUDIO_DATASET, 'dataset')

export default defineConfig({
  name: 'default',
  title: 'trustvc',

  projectId,
  dataset,

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
