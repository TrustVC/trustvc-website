interface FormAlertProps {
  isDarkMode: boolean
  error?: string | null
  success?: string | null
}

const FormAlert = ({ isDarkMode, error, success }: FormAlertProps) => {
  const message = error || success
  if (!message) return null

  return (
    <div
      role={error ? 'alert' : 'status'}
      aria-live={error ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`form-alert w-full px-4 py-3 rounded-lg text-sm font-medium font-urbanist flex items-start gap-2 ${
        error
          ? 'form-alert-error'
          : isDarkMode
            ? 'border border-emerald-400/30 text-emerald-200 bg-emerald-400/10'
            : 'border border-emerald-500/25 text-emerald-700 bg-emerald-50'
      }`}
    >
      {error && (
        <img
          src="/icons/attention.svg"
          alt=""
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
      )}
      <span>{message}</span>
    </div>
  )
}

export default FormAlert
