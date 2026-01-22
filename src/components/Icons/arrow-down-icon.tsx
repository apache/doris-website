import React from 'react';

interface ArrowDownIconProps {
    className?: string;
}
export function ArrowDownIcon(props: ArrowDownIconProps) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="14" height="8" viewBox="0 0 14 8" fill="none">
            <path
                d="M0.900391 6.52721L6.26399 1.1636C6.61547 0.812131 7.18532 0.81213 7.53679 1.1636L12.9004 6.52721"
                stroke="#1FCD94"
                stroke-width="1.8"
                stroke-linecap="round"
            />
        </svg>
    );
}
