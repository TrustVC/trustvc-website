import React, { FunctionComponent, InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
  errorMessage?: string
}

export const Input: FunctionComponent<InputProps> = ({
  className,
  hasError,
  errorMessage,
  ...props
}) => {
  return (
    <>
      <input
        className={`editable-address-input   ${hasError || errorMessage ? 'error-text' : ''} ${className}`}
        {...props}
      />
      {errorMessage && <p className="text-scarlet-500 my-2">{errorMessage}</p>}
    </>
  )
}
