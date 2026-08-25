import clsx from 'clsx'

type ToolkitIconProps = {
  src: string
  alt: string
  size?: number
  className?: string
}

const ToolkitIcon = ({ src, alt, size = 24, className }: ToolkitIconProps) => (
  <span
    className={clsx('inline-flex overflow-clip shrink-0', className)}
    style={{ width: size, height: size }}
  >
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="block size-full object-contain"
    />
  </span>
)

export default ToolkitIcon
