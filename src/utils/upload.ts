import { fetchClientSupport } from './fetchClient'

export type PresignUploadItem = {
  key: string
  uploadUrl: string
  filename: string
  expiresIn: number
}

export type CreateServiceRequestWithKeysPayload = {
  email: string
  description: string
  typeOfEnquiry: string
  domain: string
  attachmentKeys: { key: string; filename: string }[]
  recaptchaToken: string
}

export type CreateServiceRequestWithKeysResponse = {
  success: boolean
  data?: {
    message: string
    serviceRequest?: {
      id: string
      issueKey: string
      issueId: string
      portalUrl: string
      webUrl: string
    }
    attachmentsUploaded?: number
    attachmentsQueued?: number
  }
  error?: { message: string; code?: string; details?: unknown }
}

export async function getPresignedUrls(
  files: { filename: string; contentType: string; size?: number }[]
): Promise<PresignUploadItem[]> {
  const res = await fetchClientSupport.request<{
    success?: boolean
    data?: { uploads: PresignUploadItem[] }
    error?: { message: string }
  }>('/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files }),
  })
  const uploads = res.data?.uploads
  if (!uploads) {
    throw new Error(res.error?.message || 'Failed to get upload URLs')
  }
  return uploads
}

export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (_percent: number) => void,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const timeoutMs = options?.timeoutMs ?? 30000
    let settled = false

    const fail = (error: Error) => {
      if (settled) return
      settled = true
      reject(error)
    }

    const succeed = () => {
      if (settled) return
      settled = true
      resolve()
    }

    const onAbortSignal = () => xhr.abort()
    if (options?.signal) {
      if (options.signal.aborted) {
        fail(new Error('Upload aborted'))
        return
      }
      options.signal.addEventListener('abort', onAbortSignal, { once: true })
    }

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100)
        succeed()
      } else {
        fail(new Error(`Upload failed: ${xhr.status}`))
      }
    })
    xhr.addEventListener('error', () => fail(new Error('Upload failed')))
    xhr.addEventListener('abort', () => fail(new Error('Upload aborted')))
    xhr.addEventListener('timeout', () => fail(new Error('Upload timed out')))
    xhr.open('PUT', uploadUrl)
    xhr.timeout = timeoutMs
    xhr.setRequestHeader(
      'Content-Type',
      file.type || 'application/octet-stream'
    )
    xhr.send(file)
  })
}

export async function createServiceRequestWithKeys(
  payload: CreateServiceRequestWithKeysPayload
): Promise<CreateServiceRequestWithKeysResponse> {
  return fetchClientSupport.request<CreateServiceRequestWithKeysResponse>(
    '/service-request',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )
}
