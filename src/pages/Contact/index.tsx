import { AttachmentDropzone, SelectField } from './components'
import { useContactForm } from './hooks/useContactForm'

import FormAlert from '../../components/common/FormAlert'
import SubmitButton from '../../components/common/SubmitButton'
import TextAreaField from '../../components/common/TextAreaField'
import TextField from '../../components/common/TextField'

interface ContactProps {
  isDarkMode: boolean
}

const Contact = ({ isDarkMode }: ContactProps) => {
  const {
    email,
    setEmail,
    typeOfEnquiry,
    setTypeOfEnquiry,
    description,
    setDescription,
    dragActive,
    isSubmitting,
    submitError,
    submitSuccess,
    fileInfoText,
    handleDrag,
    handleDrop,
    handleFileInput,
    onSubmit,
  } = useContactForm()

  return (
    <div className={`w-full px-4 pt-[120px] pb-16 flex justify-center ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="w-full max-w-[1440px] flex flex-col items-center">
        <div className="w-full max-w-[760px] flex flex-col items-center text-center">
          <h1
            className={`text-[40px] sm:text-5xl font-extrabold font-gilroy leading-tight ${isDarkMode ? 'text-neutral-60' : 'text-primary-50'
              }`}
          >
            Contact Us
          </h1>
          <p
            className={`mt-3 text-sm sm:text-base font-medium font-gilroy ${isDarkMode ? 'text-neutral-50' : 'text-neutral-20'
              }`}
          >
            Get help with TrustVC product and services. We’ll get back to you soon
          </p>
        </div>

        <div className="w-full max-w-[920px] mt-10">
          <div className="overlay-border-shadow">
            <div className="w-full p-6 sm:p-8">
              <div className="flex flex-col gap-1">
                <div
                  className={`text-base font-bold font-gilroy ${isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
                    }`}
                >
                  Submit a Request
                </div>
                <div
                  className={`text-xs font-medium font-gilroy ${isDarkMode ? 'text-neutral-50' : 'text-neutral-20'
                    }`}
                >
                  Encountering some issues? Let us know so that we can help.
                </div>
              </div>

              <form className="mt-6 flex flex-col gap-5" onSubmit={onSubmit}>
                <FormAlert
                  isDarkMode={isDarkMode}
                  error={submitError}
                  success={submitSuccess}
                />

                <TextField
                  isDarkMode={isDarkMode}
                  id="contact-email"
                  label="Email *"
                  value={email}
                  onChange={setEmail}
                  placeholder="your.name@email.com"
                  type="email"
                  required
                />

                <SelectField
                  isDarkMode={isDarkMode}
                  id="contact-enquiry"
                  label="Type of Enquiry *"
                  value={typeOfEnquiry}
                  onChange={setTypeOfEnquiry}
                  required
                />

                <TextAreaField
                  isDarkMode={isDarkMode}
                  id="contact-description"
                  label="Description *"
                  value={description}
                  onChange={setDescription}
                  placeholder="Please provide more information about your issue."
                  required
                  rows={4}
                />

                <AttachmentDropzone
                  isDarkMode={isDarkMode}
                  dragActive={dragActive}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onFileInput={handleFileInput}
                  fileInfoText={fileInfoText}
                />

                <div className="pt-2">
                  <SubmitButton isDarkMode={isDarkMode} isSubmitting={isSubmitting} />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
