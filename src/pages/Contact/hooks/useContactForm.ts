import React, { useCallback, useMemo, useState } from 'react'
import { createServiceRequest } from '../../../utils'

type EnquiryType = '' | 'General Enquiry' | 'OpenCerts' | 'TradeTrust'

const MAX_TOTAL_UPLOAD_BYTES = 10 * 1024 * 1024

export const useContactForm = () => {
  const [email, setEmail] = useState('')
  const [typeOfEnquiry, setTypeOfEnquiry] = useState<EnquiryType>('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const fileInfoText = useMemo(() => {
    if (files.length === 0)
      return 'Maximum 10 MB. Supported files include .JPG or .PNG only.'
    if (files.length === 1) return files[0].name
    return `${files.length} files selected`
  }, [files])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const dropped = Array.from(e.dataTransfer.files || [])
    if (dropped.length > 0) {
      setFiles(dropped)
    }
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || [])
      if (selected.length > 0) {
        setFiles(selected)
      }
    },
    []
  )

  const resetForm = useCallback(() => {
    setEmail('')
    setTypeOfEnquiry('')
    setDescription('')
    setFiles([])
    setDragActive(false)
  }, [])

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitError(null)
      setSubmitSuccess(null)

      const totalBytes = files.reduce((sum, f) => sum + f.size, 0)
      if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
        setSubmitError('Attachments exceed 10 MB total size limit.')
        return
      }

      const baseUrl = (import.meta as any).env?.VITE_SUPPORT_API_BASE_URL as
        | string
        | undefined
      if (!baseUrl) {
        setSubmitError('Missing VITE_SUPPORT_API_BASE_URL configuration.')
        return
      }

      const summary = description.trim().slice(0, 100) || 'Support Request'

      const formData = new FormData()
      formData.append('email', email)
      formData.append('summary', summary)
      formData.append('description', description)
      formData.append('typeOfEnquiry', typeOfEnquiry)
      for (const file of files) {
        formData.append('attachments', file)
      }

      try {
        setIsSubmitting(true)
        await createServiceRequest(formData)

        setSubmitSuccess(
          'Request submitted successfully. We’ll get back to you soon.'
        )
        resetForm()
      } catch (err) {
        const errMessage =
          (err as { message?: string } | null | undefined)?.message ||
          'Failed to submit request.'
        setSubmitError(errMessage)
      } finally {
        setIsSubmitting(false)
      }
    },
    [description, email, files, resetForm, typeOfEnquiry]
  )

  return {
    email,
    setEmail,
    typeOfEnquiry,
    setTypeOfEnquiry,
    description,
    setDescription,
    files,
    setFiles,
    dragActive,
    setDragActive,
    isSubmitting,
    submitError,
    submitSuccess,
    fileInfoText,
    handleDrag,
    handleDrop,
    handleFileInput,
    onSubmit,
  }
}

export type { EnquiryType }
