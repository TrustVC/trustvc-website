import clsx from 'clsx'
import React from 'react'

interface FieldErrorProps {
  message: string
  id?: string
  containerClassName?: string
  textClassName?: string
  iconClassName?: string
}

export function FieldError({
  message,
  id,
  containerClassName,
  textClassName,
}: FieldErrorProps) {
  return (
    <p
      id={id}
      className={clsx(
        'field-error-text field-error-with-icon',
        containerClassName
      )}
      role="alert"
    >
      <img
        src="/icons/information-circle.svg"
        alt=""
        className="field-error-icon"
        aria-hidden="true"
      />
      <span className={clsx('field-error-text', textClassName)}>{message}</span>
    </p>
  )
}
