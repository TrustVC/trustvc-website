import { ReactNode } from 'react'
import clsx from 'clsx'

export type StatusAlertVariant = 'success' | 'error' | 'warning' | 'info'

const styles: Record<StatusAlertVariant, string> = {
  success: 'border-success-50 bg-success-100 text-success-20',
  error: 'border-alert-50 bg-alert-100 text-alert-20',
  warning: 'border-warning-50 bg-warning-100 text-warning-20',
  info: 'border-primary-100 bg-primary-100/20 text-primary-30',
}

interface StatusAlertProps {
  variant: StatusAlertVariant
  children: ReactNode
}

const StatusAlert = ({ variant, children }: StatusAlertProps) => (
  <div
    role="alert"
    data-variant={variant}
    className={clsx('rounded-lg border px-4 py-3 text-sm', styles[variant])}
  >
    {children}
  </div>
)

export default StatusAlert
