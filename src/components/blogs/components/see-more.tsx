import { ExternalLinkIcon } from '../../Icons/external-link-icon';
import React from 'react';

export function SeeMore() {
    return (
        <span style={{ color: '#444FD9', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            see more <ExternalLinkIcon />
        </span>
    );
}
