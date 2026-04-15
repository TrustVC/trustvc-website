import { FunctionComponent, LabelHTMLAttributes, ReactNode } from 'react'
import { ButtonSize, ButtonHeight } from './constants'
import type { ButtonTradeTrust } from './types'
import clsx from 'clsx'

// Shared size styles for all button components
const buttonSizeStyles = {
  [ButtonSize.XS]:
    'w-[87px] h-6 min-w-[24px] min-h-6 px-0.5 rounded text-xs leading-[165%]',
  [ButtonSize.SM]:
    'w-[91px] h-8 min-w-8 min-h-8 p-0.5 rounded-md text-xs leading-[165%]',
  [ButtonSize.MD]:
    'w-[109px] h-10 min-w-[40px] min-h-10 p-[5px] rounded-lg text-sm leading-[155%]',
  [ButtonSize.LG]:
    'w-[120px] h-12 min-w-12 min-h-12 p-2 rounded-xl text-base leading-[155%]',
  [ButtonSize.FLEX]:
    'w-[100%] h-10 min-w-[40px] min-h-10 p-[5px] rounded-lg border text-sm leading-[155%]',
}

// Base styles for all button components
const baseButtonStyles =
  'flex flex-col justify-center items-center gap-2.5 box-border transition-colors duration-200 ease-out cursor-pointer font-gilroy font-bold text-center align-middle'

// Button type styles
const getButtonTypeStyles = (btnType: 'solid' | 'transparent') =>
  btnType === 'solid'
    ? 'solid text-white border-primary-50'
    : 'transparent text-primary-50 border border-neutral-90/33'

interface LabelTradeTrust extends LabelHTMLAttributes<HTMLLabelElement> {
  size?: ButtonSize
  height?: ButtonHeight
  btnType?: 'solid' | 'transparent'
  width?: string
}

export const Button: FunctionComponent<ButtonTradeTrust> = ({
  className,
  children,
  disabled,
  size = ButtonSize.MD,
  btnType = 'solid',
  width,
  ...props
}) => {
  return (
    <button
      className={` ${baseButtonStyles} ${buttonSizeStyles[size]} ${getButtonTypeStyles(btnType)} ${className} ${
        disabled ? '!cursor-not-allowed !text-white !opacity-[0.33]' : ''
      }`}
      style={width ? { width, ...props.style } : props.style}
      type="button"
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export const ButtonIcon: FunctionComponent<ButtonTradeTrust> = ({
  className,
  children,
  disabled,
  size = ButtonSize.MD,
  btnType = 'solid',
  width,
  ...props
}) => {
  const { style: propsStyle, ...restProps } = props

  // Create style object with width
  const buttonStyle = width
    ? {
        ...propsStyle,
        width,
        minWidth: width,
        maxWidth: width,
      }
    : propsStyle

  return (
    <button
      {...restProps}
      className={` ${baseButtonStyles} ${buttonSizeStyles[size]} ${getButtonTypeStyles(btnType)} ${className || ''} ${
        disabled ? '!cursor-not-allowed !text-white !opacity-[0.33]' : ''
      }`}
      style={buttonStyle}
      type="button"
      disabled={disabled}
    >
      {children}
    </button>
  )
}

interface LinkButtonProps {
  className?: string
  href?: string
  children: ReactNode
  isDarkMode: boolean
  isDisabled?: boolean
}

export const LinkButton = ({
  className = '',
  href,
  children,
  isDarkMode,
  isDisabled,
}: LinkButtonProps) => {
  const disabled = isDisabled || !href

  return (
    <a
      href={disabled ? undefined : href}
      target={disabled ? undefined : '_blank'}
      rel={disabled ? undefined : 'noopener noreferrer'}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      onClick={event => {
        if (disabled) {
          event.preventDefault()
        }
      }}
      className={clsx(
        'bg-primary-60',
        isDarkMode ? 'bg-primary-60 text-black' : 'text-white',
        'inline-flex w-fit px-4 py-2 rounded-lg font-bold',
        disabled ? 'cursor-not-allowed opacity-50 pointer-events-none' : '',
        className
      )}
    >
      {children}
    </a>
  )
}

export const LabelButton: FunctionComponent<LabelTradeTrust> = ({
  className,
  children,
  size = ButtonSize.MD,
  btnType = 'solid',
  width,
  ...props
}) => {
  return (
    <label
      className={` ${baseButtonStyles} ${buttonSizeStyles[size]} ${getButtonTypeStyles(btnType)} ${className || ''}`}
      style={width ? { width, ...props.style } : props.style}
      {...props}
    >
      {children}
    </label>
  )
}
