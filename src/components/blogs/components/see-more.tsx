import { ExternalLinkIcon } from '../../Icons/external-link-icon';
import React from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export function SeeMore() {
    const {i18n:{currentLocale}}=useDocusaurusContext();
    return (
        <span lang={currentLocale} style={{ color: 'var(--ifm-color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {translate({id: 'blog.readOriginal', message: 'Read the original (English)'})} <ExternalLinkIcon />
        </span>
    );
}
