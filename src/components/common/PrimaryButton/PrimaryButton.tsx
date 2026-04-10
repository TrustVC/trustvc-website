import clsx from 'clsx'
import { ReactNode, MouseEvent, Ref, forwardRef } from 'react'

type PrimaryButtonSharedProps = {
  className?: string
  labelClassName?: string
  textClassName?: string
  onClick?: (event: MouseEvent<HTMLButtonElement | HTMLLabelElement>) => void
  children: ReactNode
  icon?: ReactNode
  btnType?: 'solid' | 'transparent'
  boundaryClassName?: string
  'data-testid'?: string
}

type PrimaryButtonAsButtonProps = PrimaryButtonSharedProps & {
  as?: 'button'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

type PrimaryButtonAsLabelProps = PrimaryButtonSharedProps & {
  as: 'label'
  htmlFor?: string
  disabled?: boolean
  type?: never
}

export type PrimaryButtonProps =
  | PrimaryButtonAsButtonProps
  | PrimaryButtonAsLabelProps

const PrimaryButton = forwardRef<
  HTMLButtonElement | HTMLLabelElement,
  PrimaryButtonProps
>((props, ref) => {
  const {
    className = '',
    labelClassName = '',
    textClassName = '',
    onClick,
    children,
    icon,
    btnType = 'solid',
    boundaryClassName = '',
    'data-testid': dataTestId,
  } = props

  if (props.as === 'label') {
    const isDisabled = props.disabled ?? false
    return (
      <label
        ref={ref as Ref<HTMLLabelElement>}
        htmlFor={isDisabled ? undefined : props.htmlFor}
        className={clsx('standard-button-primary', className)}
        onClick={isDisabled ? undefined : onClick}
        aria-disabled={isDisabled}
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
      </label>
    )
  }

  const { type = 'button', disabled = false } = props
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
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
})

PrimaryButton.displayName = 'PrimaryButton'

export default PrimaryButton
