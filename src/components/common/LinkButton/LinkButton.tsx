import clsx from 'clsx'
import { ReactNode } from 'react'

interface LinkButtonProps {
  className?: string
  href?: string
  children: ReactNode
  isDarkMode: boolean
  isDisabled?: boolean
}

const LinkButton = ({
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

export default LinkButton
