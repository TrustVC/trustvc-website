import React from 'react'

export type SpinnerSize = 'small' | 'medium' | 'large'

interface LoaderProps {
  label?: string
  size?: SpinnerSize
  centered?: boolean
  row?: boolean
  frameClass?: string
  spinnerClass?: string
  labelClass?: string
  color?: string
}

const Spinner: React.FC<LoaderProps> = ({
  label,
  size = 'small',
  centered = false,
  row = false,
  frameClass = '',
  spinnerClass = '',
  labelClass = '',
  color = '',
}) => {
  const colorClasses = color ? `!border-${color} !border-t-transparent` : ''

  const spinner = (
    <div
      className={`flex items-center gap-2 ${row ? 'flex-row' : 'flex-col'} ${frameClass}`}
    >
      <div
        className={`spinner spinner-${size} ${colorClasses} ${spinnerClass}`}
      />
      {label && <div className={`spinner-label ${labelClass}`}>{label}</div>}
    </div>
  )

  if (centered) {
    return <div className={`spinner-centered-wrapper `}>{spinner}</div>
  }

  return spinner
}

export default Spinner
