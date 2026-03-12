import clsx from 'clsx'
import { ReactNode } from 'react'

interface PrimaryButtonProps {
  className?: string
  onClick?: () => void
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  icon?: ReactNode
  htmlFor?: string
  as?: 'button' | 'label'
}

const PrimaryButton = ({
  className = '',
  onClick,
  children,
  type = 'button',
  disabled = false,
  icon,
  htmlFor,
  as = 'button',
}: PrimaryButtonProps) => {
  const content = (
    <div className="button-boundary">
      <div className="button-padding" />
      {icon && <div className="contextual-icon-frame">{icon}</div>}
      <div className="text-frame">
        <div className="button-label">{children}</div>
      </div>
      <div className="button-padding" />
    </div>
  )

  if (as === 'label') {
    return (
      <div className={clsx('standard-button-primary', className)}>
        <label htmlFor={htmlFor} className="button-boundary" onClick={onClick}>
          <div className="button-padding" />
          {icon && <div className="contextual-icon-frame">{icon}</div>}
          <div className="text-frame">
            <div className="button-label">{children}</div>
          </div>
          <div className="button-padding" />
        </label>
      </div>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx('standard-button-primary', className)}
    >
      {content}
    </button>
  )
}

export default PrimaryButton
