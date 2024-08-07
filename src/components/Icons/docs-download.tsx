import React from 'react';

interface DocsDownloadProps {
    className?: string;
}

export function DocsDownload(props: DocsDownloadProps) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 9L2.5 13.5H13.5V9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M5 7L8 10L11 7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M8 10V2.49996" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}
