import clsx from 'clsx'
import { ReactNode } from 'react'

interface PrimaryButtonProps {
  className?: string
  labelClassName?: string
  textClassName?: string
  onClick?: () => void
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  icon?: ReactNode
  htmlFor?: string
  as?: 'button' | 'label'
  btnType?: 'solid' | 'transparent'
  boundaryClassName?: string
  'data-testid'?: string
}

const PrimaryButton = ({
  className = '',
  labelClassName = '',
  textClassName = '',
  onClick,
  children,
  type = 'button',
  disabled = false,
  icon,
  htmlFor,
  as = 'button',
  btnType = 'solid',
  boundaryClassName = '',
  'data-testid': dataTestId,
}: PrimaryButtonProps) => {
  if (as === 'label') {
    return (
      <label
        htmlFor={htmlFor}
        className={clsx('standard-button-primary', className)}
        onClick={onClick}
      >
        <div
          className={clsx(
            'button-boundary',
            btnType === 'transparent' && 'button-boundary-transparent'
          )}
        >
          {icon && <div className="contextual-icon-frame">{icon}</div>}
          <div className={`text-frame ${textClassName}`}>
            <div className={clsx('button-label', labelClassName)}>
              {children}
            </div>
          </div>
        </div>
      </label>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx('standard-button-primary', className)}
      data-testid={dataTestId}
    >
      <div
        className={clsx(
          'button-boundary',
          btnType === 'transparent' && 'button-boundary-transparent',
          boundaryClassName
        )}
      >
        {icon && <div className="contextual-icon-frame">{icon}</div>}
        <div className={`text-frame ${textClassName}`}>
          <div className={clsx('button-label', labelClassName)}>{children}</div>
        </div>
      </div>
    </button>
  )
}

export default PrimaryButton
