import React from 'react';

interface DocsEditProps {
    className?: string;
}

export function DocsEdit(props: DocsEditProps) {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.1269 10.8845C5.15786 10.7818 5.21377 10.6883 5.28963 10.6125L13.344 2.55811C13.5979 2.30427 14.0094 2.30427 14.2632 2.55811L16.031 4.32587C16.2849 4.57972 16.2849 4.99127 16.031 5.24511L7.96499 13.3111C7.893 13.3831 7.80509 13.4372 7.70837 13.469L5.16374 14.3055C4.66428 14.4697 4.18667 14.0038 4.33841 13.5004L5.1269 10.8845Z" stroke="currentColor" stroke-width="1.2" />
            <path d="M2.5 17.4L17.5 17.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        </svg>
    );
}
