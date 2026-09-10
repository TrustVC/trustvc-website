import Overlay from '@/components/common/Overlay'
import ToolkitIcon from './ToolkitIcon'
import { TOOLKIT_ASSETS } from './assets'
import { truncateHash } from '@/utils/toolkit/revoke'

type RevokeConfirmModalProps = {
  storeAddress: string
  documentHash: string
  onCancel: () => void
  onConfirm: () => void
  isSubmitting: boolean
}

const RevokeConfirmModal = ({
  storeAddress,
  documentHash,
  onCancel,
  onConfirm,
  isSubmitting,
}: RevokeConfirmModalProps) => (
  <Overlay ariaLabel="Revoke this document?" onClose={onCancel}>
    <div className="toolkit-surface w-full max-w-[640px] mx-4 rounded-2xl border border-neutral-50/33 bg-white/90 shadow-[0px_8px_32px_0px_rgba(104,106,210,0.33)]">
      <div className="flex items-start gap-3 sm:gap-4 px-4 sm:px-6 pt-5 sm:pt-6 pb-4">
        <ToolkitIcon src={TOOLKIT_ASSETS.revokeError} alt="" size={28} />
        <h2 className="font-avenir font-medium text-[1.125rem] leading-[136%] text-neutral-20">
          Revoke this document?
        </h2>
      </div>
      <div className="border-y border-neutral-50/33 px-4 sm:px-10 py-5 sm:py-8">
        <p className="font-avenir text-base sm:text-lg leading-[1.36] text-neutral-20">
          This will permanently mark the document with target hash{' '}
          <span className="font-bold">{truncateHash(documentHash)}</span> as
          revoked on the document store at{' '}
          <span className="font-bold">{truncateHash(storeAddress)}</span>. This
          action is irreversible and, on a live network, cannot be undone.
        </p>
      </div>
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-4 sm:py-6">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-10 px-4 font-urbanist font-bold text-sm text-neutral-30"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="min-h-10 px-5 rounded-lg bg-alert-50 text-white font-urbanist font-bold text-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Revoking…' : 'Yes, revoke it'}
        </button>
      </div>
    </div>
  </Overlay>
)

export default RevokeConfirmModal
