import React from 'react';

interface ExternalLinkArrowIconProps {
    className?: string;
}

export function ExternalLinkArrowIcon(props: ExternalLinkArrowIconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="transition-slide"
            width="16"
            height="14"
            viewBox="0 0 16 14"
            fill="none"
        >
            <path
                d="M9.37549 12.3542L14.8755 6.85419L9.37549 1.35419"
                stroke="currentColor"
                strokeWidth="1.65"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M1.12549 6.85419L14.8755 6.85419"
                stroke="currentColor"
                strokeWidth="1.65"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
