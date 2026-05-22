import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { decryptString } from '@trustvc/trustvc'

interface ActionLoaderProps {
  loadDocument: (
    doc: unknown,
    chainId: string | null | undefined,
    name: string
  ) => Promise<void>
}

export const ActionLoader: React.FC<ActionLoaderProps> = ({ loadDocument }) => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const query = params.get('q')
    if (!query) return

    // Decode optional decryption key from URL hash — anchor key takes priority over payload key
    const anchorStr = decodeURIComponent(location.hash.substring(1))
    const anchor: { key?: string } = anchorStr
      ? (() => {
          try {
            return JSON.parse(anchorStr)
          } catch {
            return {}
          }
        })()
      : {}

    // Clean URL immediately so a refresh doesn't re-trigger
    navigate('/', { replace: true })
    ;(async () => {
      try {
        const action = JSON.parse(decodeURIComponent(query))
        const { type, payload } = action ?? {}

        if (type !== 'DOCUMENT' || !payload?.uri) return

        const { uri, chainId, key: payloadKey } = payload
        const key: string | undefined = anchor.key || payloadKey

        let document = await window.fetch(uri).then(response => {
          if (response.status >= 400 && response.status < 600) {
            throw new Error(`Unable to load the document from ${uri}`)
          }
          return response.json()
        })

        // opencerts-function returns the document in a nested document object
        document = document.document || document

        if (!document) {
          throw new Error(`Document at ${uri} is empty`)
        }

        // will only decrypt if type is `OPEN-ATTESTATION-TYPE-1`
        if (document.type === 'OPEN-ATTESTATION-TYPE-1') {
          if (key) {
            const decrypted = decryptString({
              tag: document.tag,
              cipherText: document.cipherText,
              iv: document.iv,
              key,
              type: document.type,
            })
            document = JSON.parse(decrypted)
          } else {
            throw new Error(
              `Unable to decrypt document with key=${key} and type=${document.type}`
            )
          }
        }

        const name = uri.split('/').pop() || 'document.json'
        await loadDocument(
          document,
          chainId != null ? String(chainId) : null,
          name
        )
      } catch (err) {
        console.error('ActionLoader: failed to load document from URL', err)
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
