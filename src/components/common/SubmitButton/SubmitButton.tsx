interface SubmitButtonProps {
  isSubmitting: boolean
}

const SubmitButton = ({ isSubmitting }: SubmitButtonProps) => {
  return (
    <button type="submit" disabled={isSubmitting} className="submit-button">
      {isSubmitting ? 'Submitting…' : 'Submit'}
    </button>
  )
}

export default SubmitButton
