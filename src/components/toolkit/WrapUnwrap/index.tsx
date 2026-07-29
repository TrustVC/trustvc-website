import { Repeat, ArrowRight } from 'react-feather'
import {
  ToolCard,
  JsonTextarea,
  CopyButton,
  DownloadButton,
  StatusAlert,
} from '@/components/toolkit/shared'
import { useWrapUnwrap } from './useWrapUnwrap'

const WrapUnwrap = () => {
  const { mode, switchMode, input, setInput, output, status, error, run } =
    useWrapUnwrap()

  const inputLabel = mode === 'wrap' ? 'Raw JSON' : 'Wrapped Document'
  const outputLabel = mode === 'wrap' ? 'Wrapped Document' : 'Raw JSON'

  return (
    <ToolCard
      icon={<Repeat size={22} />}
      title="Wrap / Unwrap"
      description="Paste raw document JSON on the left to wrap it into a verifiable, salted TrustVC/TradeTrust document — or paste a wrapped document to unwrap it back to plain JSON for inspection."
    >
      {/* Mode toggle pill */}
      <div className="mb-6 inline-flex rounded-full border border-neutral-60 bg-white p-1">
        {(['wrap', 'unwrap'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold capitalize ${
              mode === m ? 'bg-primary-60 text-white' : 'text-neutral-30'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {status === 'error' && (
        <div className="mb-4">
          <StatusAlert variant="error">{error}</StatusAlert>
        </div>
      )}
      {status === 'success' && (
        <div className="mb-4">
          <StatusAlert variant="success">
            Document {mode === 'wrap' ? 'wrapped' : 'unwrapped'} successfully.
          </StatusAlert>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 xl:flex-row xl:items-start">
        <JsonTextarea
          id="wrap-input"
          label={inputLabel}
          value={input}
          onChange={setInput}
          placeholder={
            mode === 'wrap'
              ? 'Paste document JSON here, e.g. {"name":"Alice Lim","degree":"BSc Computer Science"}'
              : 'Paste a wrapped document here'
          }
        />
        <button
          type="button"
          onClick={run}
          aria-label="Run"
          className="shrink-0 rounded-full bg-primary-60 p-3 text-white hover:bg-primary-50 xl:mt-40"
        >
          <ArrowRight size={20} />
        </button>
        <JsonTextarea
          id="wrap-output"
          label={outputLabel}
          value={output}
          readOnly
          placeholder="Output will appear here after you press run."
          actions={
            <>
              <CopyButton getText={() => output} />
              <DownloadButton
                getContent={() => output}
                filename={
                  mode === 'wrap' ? 'wrapped-document.json' : 'document.json'
                }
              />
            </>
          }
        />
      </div>
    </ToolCard>
  )
}

export default WrapUnwrap
