import {defineCliConfig} from 'sanity/cli'

const requireEnv = (
  value: string | undefined,
  name: 'projectId' | 'dataset' | 'appId'
) => {
  if (!value) {
    throw new Error(`Missing Sanity CLI ${name} environment variable`)
  }

  return value
}

const projectId = requireEnv(import.meta.env.SANITY_STUDIO_PROJECT_ID, 'projectId')
const dataset = requireEnv(import.meta.env.SANITY_STUDIO_DATASET, 'dataset')
const appId = requireEnv(import.meta.env.SANITY_STUDIO_APP_ID, 'appId')

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
    appId,
  }
})
