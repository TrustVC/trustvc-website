import { SVGProps } from 'react'

const ErrorIcon = ({
  fontSize = 24,
  stroke = 'white',
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    width={fontSize}
    height={fontSize}
    {...props}
    viewBox="0 0 32 32"
    fill="none"
  >
    <circle cx="16" cy="16" r="16" fill="#B83152" />
    <path
      d="M10 10l12 12M22 10l-12 12"
      stroke={stroke}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
)

export default ErrorIcon
