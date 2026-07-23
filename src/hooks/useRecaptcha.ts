import { useEffect, useRef } from 'react'

const SCRIPT_ID = 'recaptcha-v2-script'

type UseRecaptchaOptions = {
  siteKey: string | null | undefined
  onChange?: (token: string) => void
  onExpire?: () => void
}

export const useRecaptcha = ({
  siteKey,
  onChange,
  onExpire,
}: UseRecaptchaOptions) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<number | null>(null)
  const siteKeyRef = useRef(siteKey)
  const onChangeRef = useRef(onChange)
  const onExpireRef = useRef(onExpire)

  siteKeyRef.current = siteKey
  onChangeRef.current = onChange
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!siteKeyRef.current) return

    const ensureRendered = () => {
      if (!containerRef.current || widgetIdRef.current !== null) return
      if (!siteKeyRef.current) return
      const grecaptcha = globalThis.window?.grecaptcha
      if (!grecaptcha || typeof grecaptcha.render !== 'function') return

      widgetIdRef.current = grecaptcha.render(containerRef.current, {
        sitekey: siteKeyRef.current,
        callback: (token: string) => {
          onChangeRef.current?.(token)
        },
        'expired-callback': () => {
          onExpireRef.current?.()
        },
      })
    }

    const loadScript = () => {
      const existingScript = globalThis.document?.getElementById(SCRIPT_ID)
      if (existingScript) {
        globalThis.window?.grecaptcha?.ready(ensureRendered)
        return
      }
      const script = globalThis.document?.createElement('script')
      if (!script) return
      script.id = SCRIPT_ID
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => {
        globalThis.window?.grecaptcha?.ready(ensureRendered)
      }
      globalThis.document?.head.appendChild(script)
    }

    loadScript()

    return () => {
      widgetIdRef.current = null
    }
  }, [])

  const getToken = async (): Promise<string> => {
    const grecaptcha = globalThis.window?.grecaptcha
    if (!grecaptcha || widgetIdRef.current === null) return ''
    return grecaptcha.getResponse(widgetIdRef.current) || ''
  }

  const reset = () => {
    const grecaptcha = globalThis.window?.grecaptcha
    if (!grecaptcha || widgetIdRef.current === null) return
    grecaptcha.reset(widgetIdRef.current)
  }

  return { containerRef, getToken, reset }
}
