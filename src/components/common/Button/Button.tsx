import React, {
  FunctionComponent,
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  LabelHTMLAttributes,
} from 'react'

interface GetSharedStylesButton {
  padding: string
  height: string
}

const getSharedStylesButton = (shared: GetSharedStylesButton): string => {
  const { padding, height } = shared

  return `box-border transition-colors duration-200 ease-out cursor-pointer font-gilroy-bold border ${padding} ${height}`
}

export enum ButtonSize {
  XS = 'XS',
  SM = 'SM',
  MD = 'MD',
  LG = 'LG',
  FLEX = 'FLEX', // Flexible width button
}

export enum ButtonHeight {
  SM = 'min-h-8', // 2rem = 32px
  MD = 'min-h-10', // 2.5rem = 40px
  LG = 'min-h-12', // 3rem = 48px
}

export interface ButtonTradeTrust extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize
  height?: ButtonHeight
  btnType?: 'solid' | 'transparent'
  width?: string // Custom width (e.g., '300px', '100%')
  as?: 'button' | 'label'
  htmlFor?: string
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
    'flex flex-col justify-center items-center gap-2.5 flex-none opacity-100 box-border transition-colors duration-200 ease-out cursor-pointer font-gilroy font-bold text-center align-middle'

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
      ? 'bg-primary-50 text-white border-primary-50 hover:bg-[#4D4B9854] hover:text-[#312D62] active:bg-[#4D4B98A8] active:text-[#312D62]'
      : 'bg-white text-primary-50 border border-[#A9B2BB54] hover:bg-[#C2C5F054] active:bg-[#AAAEE654]'

  return (
    <button
      className={` ${baseStyles} ${sizeStyles[size]} ${typeStyles} ${className} ${
        disabled ? '!cursor-not-allowed !text-white !opacity-33' : ''
      }`}
      style={width ? { width, ...props.style } : props.style}
      type="submit"
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
    'flex flex-col justify-center items-center gap-2.5 flex-none opacity-100 box-border transition-colors duration-200 ease-out cursor-pointer font-gilroy font-bold text-center align-middle'

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
      ? 'bg-primary-50 text-white border-primary-50 hover:bg-[#4D4B9854] hover:text-[#312D62] active:bg-[#4D4B98A8] active:text-[#312D62]'
      : 'bg-white text-primary-50 border border-[#A9B2BB54] hover:bg-[#C2C5F054] active:bg-[#AAAEE654]'

  const { style: propsStyle, ...restProps } = props

  // Create style object with width having !important via CSS custom property
  const buttonStyle = width
    ? {
        ...propsStyle,
        width: `${width} !important`,
        minWidth: width,
        maxWidth: width,
      }
    : propsStyle

  return (
    <button
      {...restProps}
      className={` ${baseStyles} ${sizeStyles} ${typeStyles} ${className || ''} ${
        disabled ? '!cursor-not-allowed !text-white !opacity-33' : ''
      }`}
      style={buttonStyle}
      type="submit"
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
  const shared = getSharedStylesButton({ padding: size, height })

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
  const shared = getSharedStylesButton({ padding: size, height })

  return (
    <label className={`block ${shared} ${className}`} {...props}>
      {children}
    </label>
  )
}
