import clsx from 'clsx'
import { ReactNode, MouseEvent, forwardRef } from 'react'

interface PrimaryButtonProps {
  className?: string
  labelClassName?: string
  textClassName?: string
  onClick?: (event: MouseEvent<HTMLButtonElement | HTMLLabelElement>) => void
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

const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  (
    {
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
    },
    ref
  ) => {
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
        ref={ref}
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
            <div className={clsx('button-label', labelClassName)}>
              {children}
            </div>
          </div>
        </div>
      </button>
    )
  }
)

PrimaryButton.displayName = 'PrimaryButton'

export default PrimaryButton
