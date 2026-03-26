import { useRef } from 'react'
import { useContactForm } from '@/hooks/useContactForm'

import AttachmentDropzone from '@/components/common/AttachmentDropzone'
import { AttachmentFileList } from '@/components/common/AttachmentFileList'
import { FieldError } from '@/components/common/FieldError'
import FormAlert from '@/components/common/FormAlert'
import { Recaptcha, type RecaptchaHandle } from '@/components/common/Recaptcha'
import SelectField from '@/components/common/SelectField'
import SubmitButton from '@/components/common/SubmitButton'
import TextAreaField from '@/components/common/TextAreaField'
import TextField from '@/components/common/TextField'

const RECAPTCHA_SITE_KEY = import.meta.env?.VITE_RECAPTCHA_SITE_KEY as
  | string
  | undefined

interface ContactProps {
  isDarkMode: boolean
}

const Contact = ({ isDarkMode }: ContactProps) => {
  const recaptchaRef = useRef<RecaptchaHandle>(null)
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
    validateEmail,
    validateTypeOfEnquiry,
    validateDescription,
    handleDrag,
    handleDrop,
    handleFileInput,
    clearRecaptchaError,
    onSubmit,
  } = useContactForm({
    getRecaptchaToken: () =>
      RECAPTCHA_SITE_KEY
        ? (recaptchaRef.current?.getToken() ?? Promise.resolve(''))
        : Promise.resolve(''),
    resetRecaptcha: () => recaptchaRef.current?.reset(),
    recaptchaRequired: !!RECAPTCHA_SITE_KEY,
  })

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
                className="mt-3 flex flex-col"
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
                    isDarkMode={isDarkMode}
                  />
                  {fieldErrors.attachments && (
                    <FieldError
                      message={fieldErrors.attachments}
                      id="contact-attachments-error"
                    />
                  )}
                  {RECAPTCHA_SITE_KEY && (
                    <>
                      <Recaptcha
                        ref={recaptchaRef}
                        siteKey={RECAPTCHA_SITE_KEY}
                        className="flex justify-center"
                        onChange={clearRecaptchaError}
                      />
                      {fieldErrors.recaptcha && (
                        <FieldError
                          message={fieldErrors.recaptcha}
                          id="contact-recaptcha-error"
                          containerClassName="flex justify-center"
                          textClassName="text-center"
                          iconClassName="text-center"
                        />
                      )}
                    </>
                  )}
                </div>

                <div className="pt-2 flex justify-center">
                  <SubmitButton
                    isDarkMode={isDarkMode}
                    isSubmitting={isSubmitting}
                    isDisabled={isSubmitting}
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
