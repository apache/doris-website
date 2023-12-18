import Link from '@docusaurus/Link';
import React from 'react';

interface ReadMoreProps {
    to: string;
}

export default function ReadMore(props: ReadMoreProps) {
    return (
        <Link className="flex items-center cursor-pointer hover:no-underline" to={props.to}>
            <span className="text-primary mr-2">Read more</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 16 14" fill="none">
                <path
                    d="M9.37549 12.3542L14.8755 6.85419L9.37549 1.35419"
                    stroke="#444FD9"
                    stroke-width="1.65"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
                <path
                    d="M1.12549 6.85419L14.8755 6.85419"
                    stroke="#444FD9"
                    stroke-width="1.65"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        </Link>
    );
}
