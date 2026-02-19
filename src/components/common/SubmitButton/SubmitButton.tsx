interface SubmitButtonProps {
  isDarkMode: boolean
  isSubmitting: boolean
}

const SubmitButton = ({ isDarkMode, isSubmitting }: SubmitButtonProps) => {
  const baseClasses = 'submit-button'
  const themeClasses = isDarkMode ? 'bg-primary-60' : 'bg-primary-50'
  const stateClasses = isSubmitting ? 'opacity-60 cursor-not-allowed' : ''

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`${baseClasses} ${themeClasses} ${stateClasses}`.trim()}
    >
      {isSubmitting ? 'Submitting…' : 'Submit'}
    </button>
  )
}

export default SubmitButton
