import React, { useState } from 'react'
import {
  verifyDocument,
  getChainId,
  SUPPORTED_CHAINS,
  isTransferableRecord,
  isDocumentRevokable,
} from '@trustvc/trustvc'

export type VerifyStatus =
  | 'idle'
  | 'verifying'
  | 'valid'
  | 'invalid'
  | 'error'
  | 'network-select'

export type VerificationFragmentType =
  | 'DOCUMENT_INTEGRITY'
  | 'DOCUMENT_STATUS'
  | 'ISSUER_IDENTITY'

export interface VerificationFragment {
  name: string
  status: 'VALID' | 'INVALID' | 'SKIPPED'
  type: VerificationFragmentType
  reason?: unknown
}

export interface UseVerifyReturn {
  verifyStatus: VerifyStatus
  fileName: string
  errorMessage: string
  dragActive: boolean
  getGroupStatus: (_type: string) => 'VALID' | 'INVALID'
  handleDrag: (_e: React.DragEvent) => void
  handleDrop: (_e: React.DragEvent) => void
  handleFileInput: (_e: React.ChangeEvent<HTMLInputElement>) => void
  handleReset: () => void
  handleNetworkConfirm: (_chainId: string) => void
  handleNetworkCancel: () => void
}

const computeGroupStatus = (
  frags: VerificationFragment[],
  type: string
): 'VALID' | 'INVALID' => {
  const group = frags.filter(f => f.type === type)
  if (group.length === 0) return 'INVALID'
  if (group.some(f => f.status === 'INVALID')) return 'INVALID'
  if (group.some(f => f.status === 'VALID')) return 'VALID'
  return 'INVALID'
}

const getRpcUrl = (chainId: string): string | null => {
  const chainEnvUrl = import.meta.env[`VITE_RPC_URL_${chainId}`]
  if (chainEnvUrl) return chainEnvUrl

  const chainDefaultUrl =
    SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]?.rpcUrl
  const safeChainUrl = chainDefaultUrl?.includes('undefined')
    ? null
    : chainDefaultUrl
  if (safeChainUrl) return safeChainUrl

  // Chain not recognised — fall back to Ethereum mainnet RPC
  return import.meta.env.VITE_RPC_URL_1 || null
}

const toErrorMessage = (
  err: unknown,
  fallback = 'Verification failed. Please try again.'
): string => {
  if (err instanceof SyntaxError)
    return 'Invalid file format. Please upload a valid TrustVC document.'
  if (err instanceof Error) return err.message
  return fallback
}

export const useVerify = (): UseVerifyReturn => {
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle')
  const [fragments, setFragments] = useState<VerificationFragment[]>([])
  const [fileName, setFileName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [pendingDoc, setPendingDoc] = useState<unknown>(null)

  const runVerification = async (
    doc: unknown,
    chainId: string | null | undefined
  ) => {
    const options: { rpcProviderUrl?: string } = {}
    const rpcUrl = getRpcUrl(chainId ?? '1')
    if (rpcUrl) options.rpcProviderUrl = rpcUrl

    const results = (await verifyDocument(
      doc as any,
      options
    )) as VerificationFragment[]
    setFragments(results)

    const types = [...new Set(results.map(f => f.type))]
    const groupStatuses = types.map(type => computeGroupStatus(results, type))
    const hasAtLeastOneValid = groupStatuses.some(s => s === 'VALID')
    const hasNoInvalid = groupStatuses.every(s => s !== 'INVALID')
    const isValid = hasAtLeastOneValid && hasNoInvalid
    if (!isValid) setErrorMessage('Verification Failed')
    setVerifyStatus(isValid ? 'valid' : 'invalid')
  }

  const processFile = async (file: File) => {
    setFileName(file.name)
    setVerifyStatus('verifying')
    setFragments([])
    setErrorMessage('')
    setPendingDoc(null)

    try {
      const text = await file.text()
      const doc = JSON.parse(text)
      const chainId = getChainId(doc)

      if (!chainId && (isTransferableRecord(doc) || isDocumentRevokable(doc))) {
        // Document needs blockchain verification but has no embedded chain — ask the user
        setPendingDoc(doc)
        setVerifyStatus('network-select')
        return
      }

      await runVerification(doc, chainId)
    } catch (err) {
      setErrorMessage(toErrorMessage(err))
      setVerifyStatus('error')
    }
  }

  const handleNetworkConfirm = async (chainId: string) => {
    if (!pendingDoc) return
    setVerifyStatus('verifying')
    try {
      await runVerification(pendingDoc, chainId)
    } catch (err) {
      setErrorMessage(toErrorMessage(err))
      setVerifyStatus('error')
    } finally {
      setPendingDoc(null)
    }
  }

  const handleNetworkCancel = () => {
    setVerifyStatus('idle')
    setFileName('')
    setPendingDoc(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
      e.target.value = ''
    }
  }

  const handleReset = () => {
    setVerifyStatus('idle')
    setFragments([])
    setFileName('')
    setErrorMessage('')
    setPendingDoc(null)
  }

  const getGroupStatus = (type: string) => computeGroupStatus(fragments, type)

  return {
    verifyStatus,
    fileName,
    errorMessage,
    dragActive,
    getGroupStatus,
    handleDrag,
    handleDrop,
    handleFileInput,
    handleReset,
    handleNetworkConfirm,
    handleNetworkCancel,
  }
}
