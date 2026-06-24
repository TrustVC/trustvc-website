import { useEffect } from 'react'
import { initGA4 } from '../../../utils/analytics'

interface GoogleTagManagerProps {
  /** GTM container ID — e.g. GTM-XXXXXXX */
  gtmContainerId?: string
  /** GA4 measurement ID — e.g. G-XXXXXXXXXX */
  ga4TagId?: string
}

/**
 * Bootstraps analytics on mount:
 *   - Loads the GTM container script into <head> (if gtmContainerId is set)
 *   - Initialises GA4 direct tracking via react-ga4 (if ga4TagId is set)
 *
 * Renders nothing. The GTM noscript fallback lives in index.html so it works
 * before JavaScript runs.
 */
export const GoogleTagManager = ({
  gtmContainerId,
  ga4TagId,
}: GoogleTagManagerProps) => {
  useEffect(() => {
    // GA4 direct tracking
    if (ga4TagId) {
      initGA4(ga4TagId)
    }

    // GTM container
    if (gtmContainerId && !document.getElementById('gtm-script')) {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js',
      })

      const script = document.createElement('script')
      script.id = 'gtm-script'
      script.async = true
      script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmContainerId}`
      document.head.appendChild(script)
    }
  }, [gtmContainerId, ga4TagId])

  return null
}
