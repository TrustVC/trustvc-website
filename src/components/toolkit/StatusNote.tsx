import ToolkitIcon from './ToolkitIcon'
import { TOOLKIT_ASSETS } from './assets'

type StatusNoteProps = {
  kind: 'success' | 'error'
  message: string
  isDarkMode: boolean
}

const StatusNote = ({ kind, message }: StatusNoteProps) => {
  const color = kind === 'success' ? '#1f7a4d' : '#E62617'

  return (
    <div className="flex items-start gap-2 min-h-[21px]">
      <ToolkitIcon
        src={
          kind === 'success'
            ? TOOLKIT_ASSETS.checkCircle
            : TOOLKIT_ASSETS.errorX
        }
        alt=""
        size={20}
      />
      <span
        className="font-avenir text-sm leading-[21px] break-words text-left"
        style={{
          color,
          WebkitTextFillColor: color,
          background: 'none',
          backgroundClip: 'initial',
          WebkitBackgroundClip: 'initial',
        }}
      >
        {message}
      </span>
    </div>
  )
}

export default StatusNote
