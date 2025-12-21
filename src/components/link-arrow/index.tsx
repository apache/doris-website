import Link from '@docusaurus/Link';
import React, { CSSProperties } from 'react';

interface ReadMoreProps {
    to: string;
    className?: string;
    text: string | React.ReactNode;
    style?: CSSProperties;
}

export default function LinkWithArrow(props: ReadMoreProps) {
    return (
        <Link
            className={`flex group text-primary items-center text-base cursor-pointer hover:no-underline ${props?.className}`}
            to={props.to}
            onClick={e => {
                if (props.to.includes('release-4.0.0')) {
                    e.preventDefault();
                    window.open('https://doris.apache.org/zh-CN/docs/dev/releasenotes/v4.0/release-4.0.0');
                }
            }}
            style={props.style}
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
