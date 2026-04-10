export {
  fetchClientSupport,
  createFetchClient,
  FetchClientError,
} from './fetchClient'
export { createServiceRequest } from './serviceRequest'
export {
  getPresignedUrls,
  uploadToPresignedUrl,
  createServiceRequestWithKeys,
} from './upload'
export type {
  PresignUploadItem,
  CreateServiceRequestWithKeysPayload,
} from './upload'
export {
  MAGIC_WALLET_ERRORS,
  ethereumAddressFromMagicUserMetadata,
  fetchMagicEthereumAddress,
  getMagicLinkIconSrc,
  isMagicUserLoggedIn,
  preloadMagicSdk,
} from './magicWallet'
