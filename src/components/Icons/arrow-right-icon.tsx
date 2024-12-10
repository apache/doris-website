import React from 'react';

interface ArrowRightIconProps {
    className?: string;
}
export function ArrowRightIcon(props: ArrowRightIconProps) {
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
                d="M6 4.00024L9.57574 7.57598C9.81005 7.8103 9.81005 8.19019 9.57574 8.42451L6 12.0002"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
            />
        </svg>
    );
}
