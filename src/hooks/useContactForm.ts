import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getPresignedUrls,
  uploadToPresignedUrl,
  createServiceRequestWithKeys,
} from '@/utils/upload'
import {
  MAX_TOTAL_UPLOAD_BYTES,
  MAX_FILES,
  isValidFileType,
  getFileConstraintText,
} from '@/utils/attachmentConfig'
import type { AttachmentItem } from '@/types/attachment'

export type EnquiryType = '' | 'General_Enquiry' | 'OpenCerts' | 'TradeTrust'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim())
}

let idCounter = 0
function nextId() {
  return `att-${++idCounter}-${Date.now()}`
}

export type UseContactFormOptions = {
  getRecaptchaToken: () => string | Promise<string>
  resetRecaptcha?: () => void
  /** When true, submit is only enabled after the user completes reCAPTCHA */
  recaptchaRequired?: boolean
}

export const useContactForm = (options: UseContactFormOptions) => {
  const {
    getRecaptchaToken,
    resetRecaptcha,
    recaptchaRequired = false,
  } = options
  const [email, setEmail] = useState('')
  const [typeOfEnquiry, setTypeOfEnquiry] = useState<EnquiryType>('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [recaptchaCompleted, setRecaptchaCompleted] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    typeOfEnquiry?: string
    description?: string
    attachments?: string
    recaptcha?: string
  }>({})
  const uploadControllersRef = useRef<Map<string, AbortController>>(new Map())

  const fileInfoText = useMemo(() => getFileConstraintText(), [])

  const allUploaded = useMemo(
    () =>
      attachments.length === 0 ||
      attachments.every(a => a.status === 'uploaded'),
    [attachments]
  )
  const hasError = useMemo(
    () => attachments.some(a => a.status === 'error'),
    [attachments]
  )
  const isUploading = useMemo(
    () => attachments.some(a => a.status === 'uploading'),
    [attachments]
  )

  const isFormValid = useMemo(() => {
    const emailTrimmed = email.trim()
    const descriptionTrimmed = description.trim()
    const requiredFilled =
      !!emailTrimmed && !!typeOfEnquiry && !!descriptionTrimmed && !hasError
    const captchaOk = !recaptchaRequired || recaptchaCompleted
    return requiredFilled && captchaOk
  }, [
    email,
    typeOfEnquiry,
    description,
    hasError,
    recaptchaRequired,
    recaptchaCompleted,
  ])

  const setAttachmentStatus = useCallback(
    (
      id: string,
      update: Partial<
        Pick<
          AttachmentItem,
          'status' | 'progress' | 'error' | 'key' | 'filename' | 'previewUrl'
        >
      >
    ) => {
      setAttachments(prev =>
        prev.map(a => (a.id === id ? { ...a, ...update } : a))
      )
    },
    []
  )

  const clearRecaptchaError = useCallback(() => {
    setFieldErrors(prev =>
      prev.recaptcha ? { ...prev, recaptcha: undefined } : prev
    )
    setRecaptchaCompleted(true)
  }, [])

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const nonEmpty = newFiles.filter(file => file.size > 0)
      const emptyCount = newFiles.length - nonEmpty.length
      const valid = nonEmpty.filter(isValidFileType)
      const invalidCount = newFiles.length - emptyCount - valid.length
      if (emptyCount > 0) {
        setFieldErrors(prev => ({
          ...prev,
          attachments: 'Empty files are not allowed.',
        }))
      }
      if (invalidCount > 0) {
        const msg =
          'Some files were rejected. Only JPG, JPEG, and PNG files are allowed.'
        setFieldErrors(prev => ({ ...prev, attachments: msg }))
      }
      if (valid.length === 0) return

      const currentTotal = attachments.reduce((s, a) => s + a.file.size, 0)
      const addedTotal = valid.reduce((s, f) => s + f.size, 0)
      if (currentTotal + addedTotal > MAX_TOTAL_UPLOAD_BYTES) {
        const msg = 'Total file size exceeded 10 MB limit.'
        setFieldErrors(prev => ({ ...prev, attachments: msg }))
        return
      }
      if (attachments.length + valid.length > MAX_FILES) {
        const msg = `Maximum ${MAX_FILES} files allowed.`
        setFieldErrors(prev => ({ ...prev, attachments: msg }))
        return
      }

      const items: AttachmentItem[] = valid.map(file => ({
        id: nextId(),
        file,
        filename: file.name,
        status: 'pending',
        progress: 0,
        previewUrl: globalThis.URL?.createObjectURL
          ? globalThis.URL.createObjectURL(file)
          : undefined,
      }))
      setAttachments(prev => [...prev, ...items])
      setSubmitError(null)
      setFieldErrors(prev => ({ ...prev, attachments: undefined }))
    },
    [attachments]
  )

  const removeAttachment = useCallback((id: string) => {
    uploadControllersRef.current.get(id)?.abort()
    uploadControllersRef.current.delete(id)
    setAttachments(prev => {
      const toRemove = prev.find(a => a.id === id)
      const canRevoke = typeof globalThis.URL?.revokeObjectURL === 'function'
      if (toRemove?.previewUrl && canRevoke) {
        globalThis.URL.revokeObjectURL(toRemove.previewUrl)
      }
      return prev.filter(a => a.id !== id)
    })
  }, [])

  const clearAllAttachments = useCallback(() => {
    uploadControllersRef.current.forEach(controller => controller.abort())
    uploadControllersRef.current.clear()
    setAttachments(prev => {
      const canRevoke = typeof globalThis.URL?.revokeObjectURL === 'function'
      if (canRevoke) {
        prev.forEach(a => {
          if (a.previewUrl) globalThis.URL.revokeObjectURL(a.previewUrl)
        })
      }
      return []
    })
    setSubmitError(null)
    setFieldErrors(prev =>
      prev.attachments ? { ...prev, attachments: undefined } : prev
    )
  }, [])

  useEffect(() => {
    const uploadControllers = uploadControllersRef.current
    return () => {
      uploadControllers.forEach(controller => controller.abort())
      uploadControllers.clear()
    }
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      const files = Array.from(e.dataTransfer.files || [])
      addFiles(files)
    },
    [addFiles]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      addFiles(files)
      e.target.value = ''
    },
    [addFiles]
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

  const validateEmail = useCallback(() => {
    const emailTrimmed = email.trim()
    setFieldErrors(prev => {
      const next = { ...prev }
      if (!emailTrimmed)
        next.email = 'Please enter your email address before submitting.'
      else if (!isValidEmail(emailTrimmed))
        next.email = 'Please enter a valid email address.'
      else next.email = undefined
      return next
    })
  }, [email])

  const validateTypeOfEnquiry = useCallback(() => {
    setFieldErrors(prev => ({
      ...prev,
      typeOfEnquiry: typeOfEnquiry
        ? undefined
        : 'Please select an option before submitting.',
    }))
  }, [typeOfEnquiry])

  const validateDescription = useCallback(() => {
    const descriptionTrimmed = description.trim()
    setFieldErrors(prev => ({
      ...prev,
      description: descriptionTrimmed
        ? undefined
        : 'Please enter a description before submitting.',
    }))
  }, [description])

  const resetForm = useCallback(() => {
    setEmail('')
    setTypeOfEnquiry('')
    setDescription('')
    clearAllAttachments()
    setDragActive(false)
    setFieldErrors({})
    // clearAllAttachments already clears submitError
    setRecaptchaCompleted(false)
  }, [clearAllAttachments])

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
        attachments?: string
      } = {}
      if (!emailTrimmed)
        errors.email = 'Please enter your email address before submitting.'
      else if (!isValidEmail(emailTrimmed))
        errors.email = 'Please enter a valid email address.'
      if (!typeOfEnquiry)
        errors.typeOfEnquiry = 'Please select an option before submitting.'
      if (!descriptionTrimmed)
        errors.description = 'Please enter a description before submitting.'
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        return
      }

      if (hasError) {
        const msg = 'Please remove failed files or try again.'
        setFieldErrors(prev => ({ ...prev, attachments: msg }))
        return
      }

      const recaptchaToken = await Promise.resolve(getRecaptchaToken())
      if (!recaptchaToken) {
        setFieldErrors(prev => ({
          ...prev,
          recaptcha: 'Please complete the reCAPTCHA verification.',
        }))
        return
      }
      // clear any stale recaptcha error once we have a token
      setFieldErrors(prev =>
        prev.recaptcha ? { ...prev, recaptcha: undefined } : prev
      )

      const baseUrl = import.meta.env?.VITE_SUPPORT_API_BASE_URL as
        | string
        | undefined
      if (!baseUrl) {
        setSubmitError('Missing VITE_SUPPORT_API_BASE_URL configuration.')
        return
      }

      const domain = globalThis.window?.location?.hostname || ''

      try {
        setIsSubmitting(true)

        let attachmentKeys: { key: string; filename: string }[] = []

        if (attachments.length > 0) {
          const pendingItems = attachments.filter(a => a.status === 'pending')
          const alreadyUploaded = attachments.filter(
            a => a.status === 'uploaded' && a.key && a.filename
          )
          attachmentKeys = alreadyUploaded.map(a => ({
            key: a.key!,
            filename: a.filename,
          }))

          if (pendingItems.length > 0) {
            const files = pendingItems.map(a => ({
              filename: a.file.name,
              contentType: a.file.type || 'application/octet-stream',
              size: a.file.size,
            }))
            const presigned = await getPresignedUrls(files)
            const presignedByFilename = presigned.reduce<
              Record<string, typeof presigned>
            >((acc, current) => {
              if (!acc[current.filename]) acc[current.filename] = []
              acc[current.filename].push(current)
              return acc
            }, {})

            const uploadResults = await Promise.allSettled(
              pendingItems.map(item => {
                const candidateList = presignedByFilename[item.file.name] || []
                const p = candidateList.shift()
                if (!p) {
                  setAttachmentStatus(item.id, {
                    status: 'error',
                    error: 'No upload URL was returned for this file.',
                  })
                  return Promise.reject(
                    new Error('No upload URL was returned for this file.')
                  )
                }
                setAttachmentStatus(item.id, {
                  status: 'uploading',
                  progress: 0,
                })
                const uploadController = new AbortController()
                uploadControllersRef.current.set(item.id, uploadController)
                return uploadToPresignedUrl(
                  p.uploadUrl,
                  item.file,
                  percent => {
                    setAttachmentStatus(item.id, { progress: percent })
                  },
                  { signal: uploadController.signal, timeoutMs: 30000 }
                )
                  .then(() => {
                    uploadControllersRef.current.delete(item.id)
                    setAttachmentStatus(item.id, {
                      status: 'uploaded',
                      progress: 100,
                      key: p.key,
                      filename: p.filename,
                      error: undefined,
                    })
                  })
                  .catch(err => {
                    uploadControllersRef.current.delete(item.id)
                    setAttachmentStatus(item.id, {
                      status: 'error',
                      error:
                        err instanceof Error ? err.message : 'Upload failed',
                    })
                    return Promise.reject(err)
                  })
              })
            )
            const failedUploads = uploadResults.filter(
              result => result.status === 'rejected'
            )
            if (failedUploads.length > 0) {
              setSubmitError(
                'Some files failed to upload. Please remove failed files and try again.'
              )
              return
            }
            attachmentKeys = [
              ...attachmentKeys,
              ...presigned.map(p => ({ key: p.key, filename: p.filename })),
            ]
          }
        }

        await createServiceRequestWithKeys({
          email: emailTrimmed,
          description: descriptionTrimmed,
          typeOfEnquiry,
          domain,
          attachmentKeys,
          recaptchaToken,
        })
        setSubmitSuccess(
          "Request submitted successfully. We'll get back to you soon."
        )
        globalThis.window?.scrollTo({ top: 0, behavior: 'smooth' })
        resetForm()
        resetRecaptcha?.()
      } catch (err) {
        const fallback =
          'Our support system is temporarily unavailable. Please try again in a few minutes.'
        const rawMessage = (err as { message?: string } | null | undefined)
          ?.message
        const msg =
          rawMessage && rawMessage !== 'Failed to fetch' ? rawMessage : fallback
        setSubmitError(msg)
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      email,
      typeOfEnquiry,
      description,
      attachments,
      hasError,
      resetForm,
      getRecaptchaToken,
      resetRecaptcha,
      setAttachmentStatus,
    ]
  )

  return {
    email,
    setEmail: handleEmailChange,
    typeOfEnquiry,
    setTypeOfEnquiry: handleTypeOfEnquiryChange,
    description,
    setDescription: handleDescriptionChange,
    attachments,
    addFiles,
    removeAttachment,
    clearAllAttachments,
    dragActive,
    isSubmitting,
    submitError,
    submitSuccess,
    fieldErrors,
    fileInfoText,
    allUploaded,
    isUploading,
    handleDrag,
    handleDrop,
    handleFileInput,
    validateEmail,
    validateTypeOfEnquiry,
    validateDescription,
    clearRecaptchaError,
    onSubmit,
    isFormValid,
  }
}
