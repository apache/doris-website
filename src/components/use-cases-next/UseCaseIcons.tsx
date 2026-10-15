import React, { JSX } from 'react';

// Small line icons for the value cards, shared by every use-case page.
export type UseCaseIconName =
    | 'bolt'
    | 'bulb'
    | 'chart'
    | 'clock'
    | 'database'
    | 'dollar'
    | 'eye'
    | 'layers'
    | 'link'
    | 'pulse'
    | 'search'
    | 'sparkle'
    | 'table'
    | 'trend';

const ICON_PATHS: Record<UseCaseIconName, JSX.Element> = {
    bolt: <path d="M13 2 3 14h7l-1 8 11-13h-7l1-7z" />,
    bulb: (
        <>
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M12 2a7 7 0 0 0-4.9 12c.6.6 1 1.5 1 2.5h7.8c0-1 .4-1.9 1-2.5A7 7 0 0 0 12 2z" />
        </>
    ),
    chart: (
        <>
            <path d="M3 3v18h18" />
            <path d="m7 14 4-4 3 3 5-6" />
        </>
    ),
    clock: (
        <>
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 6v6l4 2" />
        </>
    ),
    database: (
        <>
            <ellipse cx="12" cy="5" rx="8" ry="3" />
            <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
            <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
        </>
    ),
    dollar: (
        <>
            <line x1="12" y1="2" x2="12" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </>
    ),
    eye: (
        <>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
        </>
    ),
    layers: (
        <>
            <path d="m12 2 9 5-9 5-9-5 9-5z" />
            <path d="m3 12 9 5 9-5" />
            <path d="m3 17 9 5 9-5" />
        </>
    ),
    link: (
        <>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </>
    ),
    pulse: <polyline points="3 12 8 12 11 7 15 17 18 12 21 12" />,
    search: (
        <>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
        </>
    ),
    sparkle: (
        <>
            <path d="M12 3v4" />
            <path d="M12 17v4" />
            <path d="M3 12h4" />
            <path d="M17 12h4" />
            <path d="m6 6 2.5 2.5" />
            <path d="M15.5 15.5 18 18" />
            <path d="m18 6-2.5 2.5" />
            <path d="M8.5 15.5 6 18" />
        </>
    ),
    table: (
        <>
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
            <path d="M9 3v18" />
        </>
    ),
    trend: (
        <>
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </>
    ),
};

export function UseCaseIcon({ name }: { name: UseCaseIconName }): JSX.Element {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {ICON_PATHS[name]}
        </svg>
    );
}

// The yellow bolt that sits inside every hero title after "Real-Time".
export function Bolt(): JSX.Element {
    return (
        <span className="uc-bolt" aria-hidden="true">
            <svg width="0.85em" height="0.85em" viewBox="0 0 24 24" fill="none">
                <path
                    d="M13 2L3 14h7l-1 8 11-13h-7l1-7z"
                    fill="var(--brand-accent)"
                    stroke="var(--brand-accent)"
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
}
