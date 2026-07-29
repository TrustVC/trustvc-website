import { useEffect, useState } from 'react'
import { Copy, Check } from 'react-feather'

interface CopyButtonProps {
  getText: () => string
  label?: string
}

const CopyButton = ({ getText, label = 'Copy' }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText())
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className="rounded-lg border border-neutral-60 bg-white p-2 text-neutral-30 hover:border-primary-60 hover:text-primary-60"
    >
      {copied ? (
        <span className="flex items-center gap-1 text-xs">
          <Check size={16} /> Copied!
        </span>
      ) : (
        <Copy size={16} />
      )}
    </button>
  )
}

export default CopyButton
