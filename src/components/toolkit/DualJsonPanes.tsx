import clsx from 'clsx'
import JsonPanel from './JsonPanel'
import ToolkitIcon from './ToolkitIcon'
import { TOOLKIT_ASSETS } from './assets'

type DualJsonPanesProps = {
  left: {
    id: string
    label: string
    value: string
    onChange?: (value: string) => void
    placeholder?: string
    showClear?: boolean
  }
  right: {
    id: string
    label: string
    value: string
    onChange?: (value: string) => void
    placeholder?: string
    readOnly?: boolean
    downloadName?: string
  }
  onRun: () => void
  runLabel: string
  runDisabled?: boolean
  isDarkMode: boolean
}

const DualJsonPanes = ({
  left,
  right,
  onRun,
  runLabel,
  runDisabled,
  isDarkMode,
}: DualJsonPanesProps) => (
  <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full min-w-0">
    <div className="w-full lg:flex-1 min-w-0">
      <JsonPanel
        id={left.id}
        label={left.label}
        value={left.value}
        onChange={left.onChange}
        placeholder={left.placeholder}
        isDarkMode={isDarkMode}
        showClear={left.showClear}
      />
    </div>
    <div className="flex justify-center items-center shrink-0">
      <button
        type="button"
        onClick={onRun}
        disabled={runDisabled}
        aria-label={runLabel}
        className={clsx(
          'size-11 sm:size-[52px] rounded-full flex items-center justify-center bg-primary-60 shadow-[0px_4px_10px_rgba(104,106,210,0.45)]',
          'rotate-90 lg:rotate-0',
          runDisabled && 'opacity-40 cursor-not-allowed'
        )}
      >
        <ToolkitIcon src={TOOLKIT_ASSETS.runArrow} alt="" size={20} />
      </button>
    </div>
    <div className="w-full lg:flex-1 min-w-0">
      <JsonPanel
        id={right.id}
        label={right.label}
        value={right.value}
        onChange={right.onChange}
        placeholder={right.placeholder}
        readOnly={right.readOnly}
        isDarkMode={isDarkMode}
        showClear={!right.readOnly}
        showDownload
        downloadName={right.downloadName}
      />
    </div>
  </div>
)

export default DualJsonPanes
