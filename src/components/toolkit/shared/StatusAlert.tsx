import { ReactNode } from 'react'
import clsx from 'clsx'

export type StatusAlertVariant = 'success' | 'error' | 'warning' | 'info'

const styles: Record<StatusAlertVariant, string> = {
  success: 'alert-success border-green-300 bg-green-50 text-green-800',
  error: 'alert-error border-alert-50 bg-alert-100 text-alert-20',
  warning: 'alert-warning border-amber-300 bg-amber-50 text-amber-800',
  info: 'alert-info border-primary-100 bg-primary-100/20 text-primary-30',
}

interface StatusAlertProps {
  variant: StatusAlertVariant
  children: ReactNode
}

const StatusAlert = ({ variant, children }: StatusAlertProps) => (
  <div
    role="alert"
    className={clsx('rounded-lg border px-4 py-3 text-sm', styles[variant])}
  >
    {children}
  </div>
)

export default StatusAlert
