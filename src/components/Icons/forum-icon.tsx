import React from 'react';

export function ForumIcon(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20" {...props}>
            <g clipPath="url(#a)">
                <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M3.75 3a.75.75 0 0 0-.75.75v9.519c0 .414.336.75.75.75h1.884v2.3a.4.4 0 0 0 .595.349l4.577-2.554a.75.75 0 0 1 .366-.095h5.078a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75zM7.5 8.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3.5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m2.5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
                    clipRule="evenodd"
                ></path>
            </g>
            <defs>
                <clipPath id="a">
                    <path fill="#fff" d="M0 0h20v20H0z"></path>
                </clipPath>
            </defs>
        </svg>
    );
}
