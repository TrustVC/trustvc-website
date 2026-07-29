import { Download } from 'react-feather'

interface DownloadButtonProps {
  getContent: () => string
  filename: string
}

const DownloadButton = ({ getContent, filename }: DownloadButtonProps) => {
  const handleDownload = () => {
    const blob = new Blob([getContent()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      aria-label="Download"
      className="rounded-lg border border-neutral-60 bg-white p-2 text-neutral-30 hover:border-primary-60 hover:text-primary-60"
    >
      <Download size={16} />
    </button>
  )
}

export default DownloadButton
