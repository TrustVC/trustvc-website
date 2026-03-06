import { useContactForm } from './hooks/useContactForm'

import AttachmentDropzone from '@/components/common/AttachmentDropzone'
import { AttachmentFileList } from '@/components/common/AttachmentFileList'
import { FieldError } from '@/components/common/FieldError'
import FormAlert from '@/components/common/FormAlert'
import SelectField from '@/components/common/SelectField'
import SubmitButton from '@/components/common/SubmitButton'
import TextAreaField from '@/components/common/TextAreaField'
import TextField from '@/components/common/TextField'

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
    attachments,
    removeAttachment,
    clearAllAttachments,
    dragActive,
    isSubmitting,
    submitError,
    submitSuccess,
    fieldErrors,
    fileInfoText,
    allUploaded,
    isUploading,
    validateEmail,
    validateTypeOfEnquiry,
    validateDescription,
    handleDrag,
    handleDrop,
    handleFileInput,
    onSubmit,
  } = useContactForm()

  return (
    <div
      className={`w-full px-4 pt-[120px] pb-16 flex justify-center ${isDarkMode ? 'dark-mode' : ''}`}
    >
      <div className="w-full max-w-[1440px] flex flex-col items-center">
        <div className="w-full max-w-[760px] flex flex-col items-center text-center">
          <h1 className="contact-heading">
            <span className="contact-heading-contact">Contact</span>{' '}
            <span className="contact-heading-us">Us</span>
          </h1>
          <p className="contact-description mt-3">
            Get help with TrustVC product and services. We&apos;ll get back to
            you soon
          </p>
        </div>

        <div className="w-full max-w-[920px] mt-10">
          <div className="overlay-border-shadow">
            <div className="w-full py-6 px-4 sm:py-8 sm:px-6">
              <div className="flex flex-col gap-1">
                <div
                  className={`submit-request-title ${
                    isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
                  }`}
                >
                  Submit a Request
                </div>
                <div
                  className={`encountering-issues-text ${
                    isDarkMode ? 'text-neutral-50' : 'text-neutral-20'
                  }`}
                >
                  Encountering some issues? Let us know so that we can help.
                </div>
              </div>

              <FormAlert
                isDarkMode={isDarkMode}
                error={submitError}
                success={submitSuccess}
              />

              <div className="mt-3 contact-form-divider" />

              <form
                className="mt-3 flex flex-col gap-5"
                onSubmit={onSubmit}
                noValidate
              >
                <div className="contact-form-fields">
                  <TextField
                    isDarkMode={isDarkMode}
                    id="contact-email"
                    label="Email *"
                    value={email}
                    onChange={setEmail}
                    onBlur={validateEmail}
                    placeholder="your.name@email.com"
                    type="email"
                    error={fieldErrors.email}
                  />

                  <SelectField
                    isDarkMode={isDarkMode}
                    id="contact-enquiry"
                    label="Type of Enquiry *"
                    value={typeOfEnquiry}
                    onChange={setTypeOfEnquiry}
                    onBlur={validateTypeOfEnquiry}
                    error={fieldErrors.typeOfEnquiry}
                  />

                  <TextAreaField
                    isDarkMode={isDarkMode}
                    id="contact-description"
                    label="Description *"
                    value={description}
                    onChange={setDescription}
                    onBlur={validateDescription}
                    placeholder="Please provide more information about your issue."
                    rows={4}
                    error={fieldErrors.description}
                  />

                  <div className="flex flex-col gap-2">
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
                  </div>
                  <AttachmentFileList
                    attachments={attachments}
                    onRemove={removeAttachment}
                    onClearAll={clearAllAttachments}
                    fileInfoText={fileInfoText}
                    isDarkMode={isDarkMode}
                  />
                  {fieldErrors.attachments && (
                    <FieldError
                      message={fieldErrors.attachments}
                      id="contact-attachments-error"
                    />
                  )}
                </div>

                <div className="pt-2 flex justify-center">
                  <SubmitButton
                    isDarkMode={isDarkMode}
                    isSubmitting={isSubmitting}
                    isDisabled={
                      isUploading || (attachments.length > 0 && !allUploaded)
                    }
                  />
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
