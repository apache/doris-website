import React, { type JSX } from 'react';
import Link from '@docusaurus/Link';
import SearchBar from '@theme/SearchBar';
import LocaleDropdownNavbarItem from '@theme/NavbarItem/LocaleDropdownNavbarItem';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type { DocsDomain } from '@site/src/utils/docs-sidebar-scope';

import styles from './DocsDomainNav.module.scss';

interface DocsDomainNavProps {
    domains: DocsDomain[];
}

function DomainLinks({ domains, mobile = false }: { domains: DocsDomain[]; mobile?: boolean }): JSX.Element {
    return (
        <>
            {domains.map(domain => (
                <Link
                    key={domain.label}
                    to={domain.href}
                    className={mobile ? styles.mobileDomainLink : styles.domainLink}
                    aria-current={domain.isActive ? 'page' : undefined}
                    onClick={event => {
                        if (!mobile) return;
                        event.currentTarget.closest('details')?.removeAttribute('open');
                    }}
                >
                    {domain.label}
                </Link>
            ))}
        </>
    );
}

export default function DocsDomainNav({ domains }: DocsDomainNavProps): JSX.Element | null {
    const {
        i18n: { currentLocale },
    } = useDocusaurusContext();
    const activeDomain = domains.find(domain => domain.isActive) ?? domains[0];
    const isZH = currentLocale === 'zh-CN';

    if (!activeDomain) {
        return null;
    }

    return (
        <nav className={styles.root} aria-label={isZH ? '文档分类导航' : 'Documentation sections'}>
            <div className={styles.inner}>
                <div className={styles.domainList}>
                    <DomainLinks domains={domains} />
                </div>

                <details className={styles.mobileDomainPicker}>
                    <summary>
                        <span>{activeDomain.label}</span>
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </summary>
                    <div className={styles.mobileDomainMenu}>
                        <DomainLinks domains={domains} mobile />
                    </div>
                </details>

                <div className={styles.utilities}>
                    <div className={styles.search}>
                        <SearchBar />
                    </div>
                    <div className={styles.locale}>
                        <LocaleDropdownNavbarItem mobile={false} {...({} as any)} />
                    </div>
                </div>
            </div>
        </nav>
    );
}
