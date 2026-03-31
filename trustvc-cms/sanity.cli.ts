import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: import.meta.env.SANITY_STUDIO_PROJECT_ID,
    dataset: import.meta.env.SANITY_STUDIO_DATASET,
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
    appId: import.meta.env.SANITY_STUDIO_APP_ID,
  }
})
