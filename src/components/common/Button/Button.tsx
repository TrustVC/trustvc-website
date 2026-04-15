import {
  FunctionComponent,
  AnchorHTMLAttributes,
  LabelHTMLAttributes,
} from 'react'
import { ButtonSize, ButtonHeight } from './constants'
import type { ButtonTradeTrust } from './types'

interface GetSharedStylesButton {
  padding: string
  height: string
}

const getSharedStylesButton = (shared: GetSharedStylesButton): string => {
  const { padding, height } = shared

  return `box-border transition-colors duration-200 ease-out cursor-pointer font-gilroy-bold border ${padding} ${height}`
}

const sharedSizeStyles = {
  [ButtonSize.XS]: 'px-0.5',
  [ButtonSize.SM]: 'p-0.5',
  [ButtonSize.MD]: 'p-[5px]',
  [ButtonSize.LG]: 'p-2',
  [ButtonSize.FLEX]: 'p-[5px]',
}

interface AnchorTradeTrust extends AnchorHTMLAttributes<HTMLAnchorElement> {
  size?: ButtonSize
  height?: ButtonHeight
}

interface LabelTradeTrust extends LabelHTMLAttributes<HTMLLabelElement> {
  size?: ButtonSize
  height?: ButtonHeight
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
  // Base styles for all buttons
  const baseStyles =
    'flex flex-col justify-center items-center gap-2.5 box-border transition-colors duration-200 ease-out cursor-pointer font-gilroy font-bold text-center align-middle'

  // Size-specific width, height, padding, border-radius, and text styles
  const sizeStyles = {
    [ButtonSize.XS]:
      'w-[87px] h-6 min-w-[24px] min-h-6 px-0.5 rounded text-xs leading-[165%]',
    [ButtonSize.SM]:
      'w-[91px] h-8 min-w-8 min-h-8 p-0.5 rounded-md text-xs leading-[165%]',
    [ButtonSize.MD]:
      'w-[109px] h-10 min-w-[40px] min-h-10 p-[5px] rounded-lg text-sm leading-[155%]',
    [ButtonSize.LG]:
      'w-[120px] h-12 min-w-12 min-h-12 p-2 rounded-xl text-base leading-[155%]',
    [ButtonSize.FLEX]:
      'w-[265px] h-10 min-w-[188px] max-w-[383px] min-h-10 p-[5px] rounded-lg border text-sm leading-[155%]',
  }

  // Button type styles
  const typeStyles =
    btnType === 'solid'
      ? 'solid text-white border-primary-50'
      : 'transparent text-primary-50 border border-neutral-90/33'

  return (
    <button
      className={` ${baseStyles} ${sizeStyles[size]} ${typeStyles} ${className} ${
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
  // Base styles for all buttons
  const baseStyles =
    'flex flex-col justify-center items-center gap-2.5 box-border transition-colors duration-200 ease-out cursor-pointer font-gilroy font-bold text-center align-middle'

  // Size-specific height, padding, border-radius, and text styles (without width)
  const sizeStylesNoWidth = {
    [ButtonSize.XS]:
      'h-6 min-w-[24px] min-h-6 px-0.5 rounded text-xs leading-[165%]',
    [ButtonSize.SM]:
      'h-8 min-w-8 min-h-8 p-0.5 rounded-md text-xs leading-[165%]',
    [ButtonSize.MD]:
      'h-10 min-w-[40px] min-h-10 p-[5px] rounded-lg text-sm leading-[155%]',
    [ButtonSize.LG]:
      'h-12 min-w-12 min-h-12 p-2 rounded-xl text-base leading-[155%]',
    [ButtonSize.FLEX]:
      'h-10 min-w-[188px] max-w-[383px] min-h-10 p-[5px] rounded-lg border text-sm leading-[155%]',
  }

  // Size-specific width, height, padding, border-radius, and text styles (with width)
  const sizeStylesWithWidth = {
    [ButtonSize.XS]:
      'w-[87px] h-6 min-w-[24px] min-h-6 px-0.5 rounded text-xs leading-[165%]',
    [ButtonSize.SM]:
      'w-[91px] h-8 min-w-8 min-h-8 p-0.5 rounded-md text-xs leading-[165%]',
    [ButtonSize.MD]:
      'w-[109px] h-10 min-w-[40px] min-h-10 p-[5px] rounded-lg text-sm leading-[155%]',
    [ButtonSize.LG]:
      'w-[120px] h-12 min-w-12 min-h-12 p-2 rounded-xl text-base leading-[155%]',
    [ButtonSize.FLEX]:
      'w-[265px] h-10 min-w-[188px] max-w-[383px] min-h-10 p-[5px] rounded-lg border text-sm leading-[155%]',
  }

  const sizeStyles = width ? sizeStylesNoWidth[size] : sizeStylesWithWidth[size]

  // Button type styles
  const typeStyles =
    btnType === 'solid'
      ? 'solid text-white border-primary-50'
      : 'transparent text-primary-50 border border-neutral-90/33'

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
      className={` ${baseStyles} ${sizeStyles} ${typeStyles} ${className || ''} ${
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

export const LinkButton: FunctionComponent<AnchorTradeTrust> = ({
  className,
  children,
  size = ButtonSize.MD,
  height = ButtonHeight.MD,
  ...props
}) => {
  const shared = getSharedStylesButton({
    padding: sharedSizeStyles[size],
    height,
  })

  return (
    <a
      className={`block ${shared} ${className}`}
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  )
}

export const LabelButton: FunctionComponent<LabelTradeTrust> = ({
  className,
  children,
  size = ButtonSize.MD,
  height = ButtonHeight.MD,
  ...props
}) => {
  const shared = getSharedStylesButton({
    padding: sharedSizeStyles[size],
    height,
  })

  return (
    <label className={`block ${shared} ${className}`} {...props}>
      {children}
    </label>
  )
}
