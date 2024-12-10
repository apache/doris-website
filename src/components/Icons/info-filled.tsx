import React from 'react';

interface InfoFilledIconProps {
    className?: string;
}
export function InfoFilledIcon(props: InfoFilledIconProps) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.8">
                <path d="M21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25C17.3848 2.25 21.75 6.61522 21.75 12Z" stroke="#4C576C" stroke-width="1.5" />
                <path d="M13.0492 6.89953C13.0492 7.47938 12.5791 7.94945 11.9992 7.94945C11.4193 7.94945 10.9492 7.47938 10.9492 6.89953C10.9492 6.31967 11.4193 5.84961 11.9992 5.84961C12.5791 5.84961 13.0492 6.31967 13.0492 6.89953Z" fill="#4C576C" />
                <path d="M12 10.5V17.25" stroke="#4C576C" stroke-width="1.5" stroke-linecap="round" />
            </g>
        </svg>
    );
}
