interface ConfirmRevokeModalProps {
  storeAddress: string
  documentHash: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmRevokeModal = ({
  storeAddress,
  documentHash,
  onConfirm,
  onCancel,
}: ConfirmRevokeModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-10/60 px-4">
    <div className="w-full max-w-xl rounded-2xl bg-white">
      <header className="border-b border-neutral-60 px-6 py-4">
        <h3 className="text-base font-bold text-neutral-10">
          Confirm revocation
        </h3>
      </header>
      <div className="px-6 py-5 text-sm text-neutral-30">
        <p>
          You are about to permanently revoke this document on-chain. This
          cannot be undone.
        </p>
        <dl className="mt-4 space-y-2 font-mono text-xs">
          <div>
            <dt className="font-sans font-semibold text-neutral-10">
              Store Address
            </dt>
            <dd className="break-all">{storeAddress}</dd>
          </div>
          <div>
            <dt className="font-sans font-semibold text-neutral-10">
              Certificate Hash
            </dt>
            <dd className="break-all">{documentHash}</dd>
          </div>
        </dl>
      </div>
      <footer className="flex justify-end gap-3 border-t border-neutral-60 px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-neutral-60 px-5 py-2 text-sm font-semibold text-neutral-30"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-alert-50 px-5 py-2 text-sm font-semibold text-white hover:bg-alert-20"
        >
          Confirm
        </button>
      </footer>
    </div>
  </div>
)

export default ConfirmRevokeModal
