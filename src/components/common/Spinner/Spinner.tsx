import React from 'react'

export type SpinnerSize = 'small' | 'medium' | 'large'

interface LoaderProps {
  label?: string
  size?: SpinnerSize
  className?: string
  centered?: boolean
}

const Spinner: React.FC<LoaderProps> = ({
  label,
  size = 'small',
  className = '',
  centered = false,
}) => {
  const spinner = (
    <div>
      <div className={`spinner spinner-${size} `} />
      <div className="spinner-label">{label}</div>
    </div>
  )

  if (centered) {
    return (
      <div className={`spinner-centered-wrapper ${className}`}>{spinner}</div>
    )
  }

  return spinner
}

export default Spinner
