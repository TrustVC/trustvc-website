import { SVGProps } from 'react'

const SuccessIcon = ({ fontSize = 28, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    width={fontSize}
    height={fontSize}
    {...props}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M25.6666 12.9262V13.9995C25.6651 16.5153 24.8505 18.9633 23.3441 20.9783C21.8378 22.9933 19.7204 24.4674 17.3078 25.1807C14.8953 25.8941 12.3167 25.8084 9.9568 24.9365C7.59688 24.0647 5.58201 22.4533 4.21271 20.3428C2.8434 18.2322 2.19301 15.7356 2.35854 13.2252C2.52407 10.7148 3.49666 8.32523 5.13124 6.41277C6.76583 4.50031 8.97483 3.16746 11.4288 2.61302C13.8828 2.05858 16.4502 2.31224 18.7483 3.33618"
      stroke="#3AAF86"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M25.6667 4.66602L14 16.3443L10.5 12.8443"
      stroke="#3AAF86"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default SuccessIcon
