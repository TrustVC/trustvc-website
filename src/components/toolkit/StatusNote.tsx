import clsx from 'clsx'
import ToolkitIcon from './ToolkitIcon'
import { TOOLKIT_ASSETS } from './assets'

type StatusNoteProps = {
  kind: 'success' | 'error'
  message: string
}

const StatusNote = ({ kind, message }: StatusNoteProps) => (
  <div className="flex items-start gap-2 min-h-[21px]">
    <ToolkitIcon
      src={
        kind === 'success' ? TOOLKIT_ASSETS.checkCircle : TOOLKIT_ASSETS.errorX
      }
      alt=""
      size={20}
    />
    <span
      role="status"
      aria-live={kind === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={clsx(
        'font-avenir text-sm leading-[21px] break-words text-left whitespace-pre-line',
        kind === 'success' ? 'text-[#3AAF86]' : 'text-alert-50'
      )}
    >
      {message}
    </span>
  </div>
)

export default StatusNote
