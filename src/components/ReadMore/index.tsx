import Link from '@docusaurus/Link';
import React from 'react';

interface ReadMoreProps {
    to: string;
    className?: string;
}

export default function ReadMore(props: ReadMoreProps) {
    return (
        <Link
            className={`flex group text-primary items-center cursor-pointer hover:no-underline ${props?.className}`}
            to={props.to}
        >
            <span className="mr-2 ">Read more</span>
            <span className="transition-slide">
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
            </span>
        </Link>
    );
}
