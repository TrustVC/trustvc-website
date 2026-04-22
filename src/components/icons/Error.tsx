import { SVGProps } from 'react'

const ErrorIcon = ({
  fontSize = 24,
  stroke = '#B83152',
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M25.93 11.6218L26.0719 12.6858C26.4031 15.1797 25.9193 17.7139 24.6926 19.9104C23.4659 22.1069 21.5621 23.848 19.265 24.874C16.9679 25.9001 14.4007 26.1562 11.9462 25.604C9.49172 25.0518 7.28148 23.721 5.64512 21.8101C4.00877 19.8991 3.03397 17.5104 2.86611 15.0002C2.69825 12.49 3.34633 9.99274 4.71368 7.88094C6.08104 5.76913 8.09441 4.15591 10.4535 3.28185C12.8126 2.4078 15.3911 2.31975 17.8043 3.03084"
      stroke={stroke}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.5997 9.7998L11.1997 18.1998"
      stroke={stroke}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.1997 9.80021L19.5997 18.2002"
      stroke={stroke}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default ErrorIcon
