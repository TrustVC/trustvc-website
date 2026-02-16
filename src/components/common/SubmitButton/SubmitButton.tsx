interface SubmitButtonProps {
  isDarkMode: boolean
  isSubmitting: boolean
}

const SubmitButton = ({ isDarkMode, isSubmitting }: SubmitButtonProps) => {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`w-full h-12 rounded-lg text-white text-sm font-bold font-gilroy transition-opacity ${
        isDarkMode
          ? 'bg-primary-60 hover:opacity-90'
          : 'bg-primary-50 hover:opacity-90'
      } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {isSubmitting ? 'Submitting…' : 'Submit'}
    </button>
  )
}

export default SubmitButton
