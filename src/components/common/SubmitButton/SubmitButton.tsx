interface SubmitButtonProps {
  isDarkMode: boolean
  isSubmitting: boolean
  /** Optional: disable the button for other reasons (e.g. uploads in progress) */
  isDisabled?: boolean
}

const SubmitButton = ({
  isDarkMode,
  isSubmitting,
  isDisabled,
}: SubmitButtonProps) => {
  const baseClasses = 'submit-button'
  const themeClasses = isDarkMode ? 'bg-primary-60' : 'bg-primary-50'
  const disabled = isSubmitting || isDisabled
  const stateClasses = disabled ? 'opacity-60 cursor-not-allowed' : ''

  return (
    <button
      type="submit"
      disabled={disabled}
      className={`${baseClasses} ${themeClasses} ${stateClasses}`.trim()}
    >
      {isSubmitting ? 'Submitting…' : 'Submit'}
    </button>
  )
}

export default SubmitButton
