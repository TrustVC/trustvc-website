import { SVGProps } from "react";

const CodeIcon = ({ fontSize = 24, stroke = "currentColor", ...props }: SVGProps<SVGSVGElement>) => (
    <svg
        width={fontSize}
        height={fontSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            d="M16 16.9976L22 11.9998L16 7.00195"
            stroke={stroke}
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M8 7.00195L2 11.9998L8 16.9976"
            stroke={stroke}
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export default CodeIcon;