import { ButtonHTMLAttributes } from 'react'
import { ButtonSize, ButtonHeight } from './constants'

export interface ButtonTradeTrust extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize
  height?: ButtonHeight
  btnType?: 'solid' | 'transparent'
  width?: string // Custom width (e.g., '300px', '100%')
  as?: 'button' | 'label'
}
