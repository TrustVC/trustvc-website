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
      className={`w-full px-4 py-3 rounded-lg border text-sm font-medium font-gilroy ${
        error
          ? isDarkMode
            ? 'border-red-500/40 text-red-200 bg-red-500/10'
            : 'border-red-500/30 text-red-700 bg-red-50'
          : isDarkMode
            ? 'border-emerald-400/30 text-emerald-200 bg-emerald-400/10'
            : 'border-emerald-500/25 text-emerald-700 bg-emerald-50'
      }`}
    >
      {message}
    </div>
  )
}

export default FormAlert
