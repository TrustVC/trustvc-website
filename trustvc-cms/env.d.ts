interface ImportMetaEnv {
  readonly SANITY_STUDIO_PROJECT_ID?: string
  readonly SANITY_STUDIO_DATASET?: string
  readonly SANITY_STUDIO_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
