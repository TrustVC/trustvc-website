import React, { useImperativeHandle, forwardRef } from 'react'
import { useRecaptcha } from '@/hooks/useRecaptcha'

declare global {
  interface Window {
    grecaptcha?: {
      /**
       * reCAPTCHA v2 global helper (loaded from https://www.google.com/recaptcha/api.js)
       */
      ready: (cb: () => void) => void
      render: (
        container: HTMLElement,
        params: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
        }
      ) => number
      getResponse: (widgetId?: number) => string
      reset: (widgetId?: number) => void
    }
  }
}

export interface RecaptchaHandle {
  /** Returns a Promise that resolves with the reCAPTCHA v2 checkbox token. */
  getToken: () => Promise<string>
  reset: () => void
}

interface RecaptchaProps {
  siteKey: string
  className?: string
  onChange?: (token: string) => void
}

export const Recaptcha = forwardRef<RecaptchaHandle, RecaptchaProps>(
  function Recaptcha({ siteKey, className, onChange }, ref) {
    const { containerRef, getToken, reset } = useRecaptcha({
      siteKey,
      onChange,
    })

    useImperativeHandle(
      ref,
      () => ({
        getToken,
        reset,
      }),
      [getToken, reset]
    )

    if (!siteKey) return null

    return <div ref={containerRef} className={className} />
  }
)
