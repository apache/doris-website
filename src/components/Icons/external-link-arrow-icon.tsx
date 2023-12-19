import React from 'react';

interface ExternalLinkArrowIconProps {
    className?: string;
}

export function ExternalLinkArrowIcon(props: ExternalLinkArrowIconProps) {
    return (
        <svg
            width="1rem"
            height="1rem"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={props.className}
        >
            <path
                d="M10.125 13.5L14.625 9L10.125 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M3.375 9.00055L14.625 9.00055"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
