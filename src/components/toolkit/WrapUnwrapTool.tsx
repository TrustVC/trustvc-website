import { useState } from 'react'
import ModeToggle from './ModeToggle'
import DualJsonPanes from './DualJsonPanes'
import StatusNote from './StatusNote'
import {
  diagnoseDocument,
  detectVersion,
  isRawDocument,
  parseJsonDocument,
  prettyJson,
  unwrapDocument,
  wrapRawDocument,
} from '@/utils/toolkit/wrap'

type WrapUnwrapToolProps = {
  isDarkMode: boolean
}

const WrapUnwrapTool = ({ isDarkMode }: WrapUnwrapToolProps) => {
  const [mode, setMode] = useState<'wrap' | 'unwrap'>('wrap')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  const run = async () => {
    setStatus(null)
    setOutput('')
    const parsed = parseJsonDocument(input)
    if (!parsed.ok) {
      setStatus({ kind: 'error', message: parsed.error })
      return
    }

    const version = detectVersion(parsed.value)
    if (!version) {
      setStatus({
        kind: 'error',
        message: 'Document is not a valid OpenAttestation certificate.',
      })
      return
    }

    try {
      if (mode === 'wrap') {
        if (!isRawDocument(parsed.value)) {
          setStatus({
            kind: 'error',
            message: 'Paste a raw (unwrapped) document to wrap.',
          })
          return
        }
        const errors = diagnoseDocument(parsed.value, version, 'raw')
        if (errors.length > 0) {
          setStatus({
            kind: 'error',
            message: `Document is not valid: ${errors.map(error => error.message).join('; ')}`,
          })
          return
        }
        const wrapped = await wrapRawDocument(parsed.value)
        setOutput(prettyJson(wrapped))
        setStatus({
          kind: 'success',
          message: 'Document wrapped successfully.',
        })
        return
      }

      const errors = diagnoseDocument(parsed.value, version, 'wrapped')
      if (errors.length > 0) {
        setStatus({
          kind: 'error',
          message: `Document is not valid: ${errors.map(error => error.message).join('; ')}`,
        })
        return
      }
      const unwrapped = unwrapDocument(parsed.value)
      setOutput(prettyJson(unwrapped))
      setStatus({
        kind: 'success',
        message: 'Document unwrapped successfully.',
      })
    } catch (error) {
      setStatus({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to process this document.',
      })
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8 min-w-0">
      <div className="flex items-center">
        <ModeToggle
          value={mode}
          options={[
            { id: 'wrap', label: 'Wrap' },
            { id: 'unwrap', label: 'Unwrap' },
          ]}
          onChange={next => {
            setMode(next)
            setOutput('')
            setStatus(null)
          }}
          isDarkMode={isDarkMode}
        />
      </div>
      <DualJsonPanes
        isDarkMode={isDarkMode}
        onRun={run}
        runLabel={mode === 'wrap' ? 'Wrap document' : 'Unwrap document'}
        left={{
          id: 'toolkit-wrap-input',
          label: mode === 'wrap' ? 'RAW JSON' : 'WRAPPED DOCUMENT',
          value: input,
          onChange: value => {
            setInput(value)
            setStatus(null)
          },
          placeholder:
            mode === 'wrap'
              ? 'Paste document JSON here, e.g. {"name":"Alice Lim","degree":"BSc Computer Science"}'
              : 'Paste a wrapped document JSON here.',
        }}
        right={{
          id: 'toolkit-wrap-output',
          label: mode === 'wrap' ? 'WRAPPED DOCUMENT' : 'RAW JSON',
          value: output,
          readOnly: true,
          placeholder: 'Output will appear here after you press run.',
          downloadName:
            mode === 'wrap'
              ? 'wrapped-document.json'
              : 'unwrapped-document.json',
        }}
      />
      {status && <StatusNote kind={status.kind} message={status.message} />}
    </div>
  )
}

export default WrapUnwrapTool
