import clsx from 'clsx'
import { ReactNode, MouseEvent, forwardRef, type Ref } from 'react'

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

/** Default: renders `<button>`. `type` / `disabled` apply to the native button. */
export type PrimaryButtonAsButtonProps = PrimaryButtonSharedProps & {
  as?: 'button'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

/** Renders `<label htmlFor=…>`; use with a hidden file input, etc. */
export type PrimaryButtonAsLabelProps = PrimaryButtonSharedProps & {
  as: 'label'
  htmlFor?: string
  type?: never
  disabled?: never
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
    const { htmlFor } = props
    return (
      <label
        ref={ref as Ref<HTMLLabelElement>}
        htmlFor={htmlFor}
        className={clsx('standard-button-primary', className)}
        onClick={onClick}
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
