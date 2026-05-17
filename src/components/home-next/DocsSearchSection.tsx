import React, { JSX, useEffect, useRef } from 'react';
import SearchBar from '@theme/SearchBar';
import './DocsSearchSection.scss';

const PLACEHOLDER = 'Search documentation';

export function DocsSearchSection(): JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null);

    // SearchBar's placeholder is locale-translated by Docusaurus, so on zh-CN
    // it renders "搜索". Force English here since this section is meant to be
    // a stable, locale-agnostic entry point for docs search.
    useEffect(() => {
        const input = containerRef.current?.querySelector<HTMLInputElement>('input.navbar__search-input');
        if (input) {
            input.setAttribute('placeholder', PLACEHOLDER);
            input.setAttribute('aria-label', PLACEHOLDER);
        }
    }, []);

    return (
        <div className="docs-search-section" ref={containerRef}>
            <div className="docs-search-section__inner">
                <SearchBar />
            </div>
        </div>
    );
}
