import React, { JSX, ReactNode } from 'react';

function Icon({ children }: { children: ReactNode }): JSX.Element {
    return (
        <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {children}
        </svg>
    );
}

export const IconArrowLeft = (): JSX.Element => (
    <Icon>
        <path d="M13 8H4M7.5 4.5 4 8l3.5 3.5" />
    </Icon>
);

export const IconArrowRight = (): JSX.Element => (
    <Icon>
        <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
    </Icon>
);

export const IconArrowDown = (): JSX.Element => (
    <Icon>
        <path d="M8 3v9M4.5 8.5 8 12l3.5-3.5" />
    </Icon>
);

export const IconChevronUp = (): JSX.Element => (
    <Icon>
        <path d="M4 10l4-4 4 4" />
    </Icon>
);

export const IconChevronDown = (): JSX.Element => (
    <Icon>
        <path d="M4 6l4 4 4-4" />
    </Icon>
);

export const IconExternal = (): JSX.Element => (
    <Icon>
        <path d="M9.5 2.5h4v4M13.5 2.5l-6 6M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" />
    </Icon>
);

export const IconCopy = (): JSX.Element => (
    <Icon>
        <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" />
        <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
    </Icon>
);

export const IconSearch = (): JSX.Element => (
    <Icon>
        <circle cx="7" cy="7" r="4.5" />
        <path d="M10.5 10.5 14 14" />
    </Icon>
);

export const IconPanel = (): JSX.Element => (
    <Icon>
        <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
        <path d="M9 2.5v11" />
    </Icon>
);
