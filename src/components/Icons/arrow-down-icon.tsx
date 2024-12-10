import React from 'react';

interface ArrowDownIconProps {
    className?: string;
}
export function ArrowDownIcon(props: ArrowDownIconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 16 16"
            fill="none"
            className={props.className}
        >
            <path
                d="M4 6L7.57574 9.57574C7.81005 9.81005 8.18995 9.81005 8.42426 9.57574L12 6"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
            />
        </svg>
    );
}
