import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

interface DorisLogoHorizontalProps {
    className?: string;
}

// Preserve the original cropped artwork and aspect ratio while sharing its
// paths across every static page instead of repeating them in the HTML.
export function DorisLogoHorizontal({ className }: DorisLogoHorizontalProps) {
    const source = useBaseUrl('/images/brand-assets/doris-logo-horizontal-mark.svg');
    return <img className={className} src={source}
        width="238" height="83" alt="" aria-hidden="true" />;
}
