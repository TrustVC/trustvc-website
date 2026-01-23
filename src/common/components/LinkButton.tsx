interface LinkButtonProps {
  className?: string
  href: string
  children: React.ReactNode
}

const LinkButton = ({ className = '', href, children }: LinkButtonProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex w-fit px-4 py-2 rounded-lg font-bold ${className}`}
  >
    {children}
  </a>
)

export default LinkButton
