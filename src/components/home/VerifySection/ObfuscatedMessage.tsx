import React, { FunctionComponent, useEffect, useState } from 'react'
import { isObfuscated } from '@trustvc/trustvc'

interface ObfuscatedMessageProps {
  document: unknown
}

export const ObfuscatedMessage: FunctionComponent<ObfuscatedMessageProps> = ({
  document,
}) => {
  const [isDocumentObfuscated, setIsDocumentObfuscated] = useState<
    boolean | null
  >(null)

  useEffect(() => {
    let cancelled = false
    const checkObfuscation = async () => {
      try {
        const result = await isObfuscated(document as any)
        if (!cancelled) setIsDocumentObfuscated(result)
      } catch (error) {
        console.warn('Error checking if document is obfuscated:', error)
        if (!cancelled) setIsDocumentObfuscated(false)
      }
    }
    checkObfuscation()
    return () => {
      cancelled = true
    }
  }, [document])

  if (isDocumentObfuscated === null || !isDocumentObfuscated) return null

  return (
    <div
      data-testid="obfuscation-info"
      style={{
        textAlign: 'left',
        color: '#DC2626',
        fontSize: '16px',
        padding: '16px 0',
      }}
    >
      Note: There are fields/data obfuscated in this document.
    </div>
  )
}

export default ObfuscatedMessage
