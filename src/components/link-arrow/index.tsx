import Link from '@docusaurus/Link';
import React from 'react';

interface ReadMoreProps {
    to: string;
    className?: string;
    text: string | React.ReactNode;
}

export default function LinkWithArrow(props: ReadMoreProps) {
    return (
        <Link
            className={`flex group text-primary items-center text-base cursor-pointer hover:no-underline ${props?.className}`}
            to={props.to}
        >
            <span className="mr-2">{props.text}</span>
            <span className="transition-slide">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="transition-slide"
                    width="1em"
                    height="1em"
                    viewBox="0 0 16 14"
                    fill="none"
                >
                    <path
                        d="M9.37549 12.3542L14.8755 6.85419L9.37549 1.35419"
                        stroke="currentColor"
                        stroke-width="1.65"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <path
                        d="M1.12549 6.85419L14.8755 6.85419"
                        stroke="currentColor"
                        stroke-width="1.65"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </span>
        </Link>
    );
}
