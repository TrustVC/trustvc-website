import React, { useCallback, useMemo, useState } from 'react'
import { createServiceRequest } from '@/utils'

type EnquiryType = '' | 'General_Enquiry' | 'OpenCerts' | 'TradeTrust'

const MAX_TOTAL_UPLOAD_BYTES = 10 * 1024 * 1024

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const ALLOWED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png']

const isValidFileType = (file: File): boolean => {
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf('.'))
  return (
    ALLOWED_FILE_TYPES.includes(file.type.toLowerCase()) ||
    ALLOWED_FILE_EXTENSIONS.includes(extension)
  )
}

export const useContactForm = () => {
  const [email, setEmail] = useState('')
  const [typeOfEnquiry, setTypeOfEnquiry] = useState<EnquiryType>('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    typeOfEnquiry?: string
    description?: string
  }>({})

  const fileInfoText = useMemo(() => {
    if (files.length === 0)
      return 'Maximum 10 MB. Supported files include .JPG, .JPEG, or .PNG only.'
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

  const setFilesFromList = useCallback((list: FileList | File[]) => {
    const next = Array.isArray(list) ? list : Array.from(list)
    const validFiles = next.filter(isValidFileType)
    if (validFiles.length !== next.length) {
      setSubmitError(
        'Some files were rejected. Only JPG, JPEG, and PNG files are allowed.'
      )
    }
    if (validFiles.length > 0) setFiles(validFiles)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const dropped = Array.from(e.dataTransfer.files || [])
    const validFiles = dropped.filter(isValidFileType)
    if (validFiles.length !== dropped.length) {
      setSubmitError(
        'Some files were rejected. Only JPG, JPEG, and PNG files are allowed.'
      )
    }
    if (validFiles.length > 0) setFiles(validFiles)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) setFilesFromList(e.target.files)
    },
    [setFilesFromList]
  )

  const handleEmailChange = useCallback(
    (value: React.SetStateAction<string>) => {
      setEmail(value)
      setFieldErrors(prev =>
        prev.email ? { ...prev, email: undefined } : prev
      )
    },
    []
  )
  const handleTypeOfEnquiryChange = useCallback(
    (value: React.SetStateAction<EnquiryType>) => {
      setTypeOfEnquiry(value)
      setFieldErrors(prev =>
        prev.typeOfEnquiry ? { ...prev, typeOfEnquiry: undefined } : prev
      )
    },
    []
  )
  const handleDescriptionChange = useCallback(
    (value: React.SetStateAction<string>) => {
      setDescription(value)
      setFieldErrors(prev =>
        prev.description ? { ...prev, description: undefined } : prev
      )
    },
    []
  )

  const resetForm = useCallback(() => {
    setEmail('')
    setTypeOfEnquiry('')
    setDescription('')
    setFiles([])
    setDragActive(false)
    setFieldErrors({})
  }, [])

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitError(null)
      setSubmitSuccess(null)
      setFieldErrors({})

      const emailTrimmed = email.trim()
      const descriptionTrimmed = description.trim()
      const errors: {
        email?: string
        typeOfEnquiry?: string
        description?: string
      } = {}
      if (!emailTrimmed)
        errors.email = 'Please enter your email address before submitting.'
      if (!typeOfEnquiry)
        errors.typeOfEnquiry = 'Please select an option before submitting.'
      if (!descriptionTrimmed)
        errors.description = 'Please enter a description before submitting.'

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        return
      }

      // Validate file types
      const invalidFiles = files.filter(f => !isValidFileType(f))
      if (invalidFiles.length > 0) {
        setSubmitError(
          'Invalid file type. Only JPG, JPEG, and PNG files are allowed.'
        )
        return
      }

      const totalBytes = files.reduce((sum, f) => sum + f.size, 0)
      if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
        setSubmitError('Attachments exceed 10 MB total size limit.')
        return
      }

      const baseUrl = import.meta.env?.VITE_SUPPORT_API_BASE_URL as
        | string
        | undefined
      if (!baseUrl) {
        setSubmitError('Missing VITE_SUPPORT_API_BASE_URL configuration.')
        return
      }

      const domain =
        typeof window !== 'undefined'
          ? window.location.hostname
          : (import.meta.env?.VITE_ENTRY_POINT as string) || 'trustvc.io'

      const formData = new FormData()
      formData.append('email', email)
      formData.append('description', description)
      formData.append('typeOfEnquiry', typeOfEnquiry)
      formData.append('domain', domain)
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
    setEmail: handleEmailChange,
    typeOfEnquiry,
    setTypeOfEnquiry: handleTypeOfEnquiryChange,
    description,
    setDescription: handleDescriptionChange,
    files,
    setFiles,
    dragActive,
    setDragActive,
    isSubmitting,
    submitError,
    submitSuccess,
    fieldErrors,
    setFieldErrors,
    fileInfoText,
    handleDrag,
    handleDrop,
    handleFileInput,
    onSubmit,
  }
}

export type { EnquiryType }
