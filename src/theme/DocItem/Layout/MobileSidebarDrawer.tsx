import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useLocation } from '@docusaurus/router';
import { useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { useAlternatePageUtils } from '@docusaurus/theme-common/internal';
import DocSidebarItems from '@theme/DocSidebarItems';
import SearchBar from '@theme/SearchBar';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import styles from './MobileSidebarDrawer.module.css';

export default function MobileSidebarDrawer(): JSX.Element | null {
    const sidebar = useDocsSidebar();
    const { pathname, search, hash } = useLocation();
    const {
        i18n: { currentLocale, locales, localeConfigs },
    } = useDocusaurusContext();
    const alternatePageUtils = useAlternatePageUtils();
    const isZH = currentLocale === 'zh-CN';
    const [open, setOpen] = useState(false);
    const [localeOpen, setLocaleOpen] = useState(false);
    const localeContainerRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!open) return undefined;
        const { style } = document.body;
        const previous = style.overflow;
        style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => {
            style.overflow = previous;
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    useEffect(() => {
        setOpen(false);
        setLocaleOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!localeOpen) return undefined;
        const onDocClick = (e: MouseEvent) => {
            const container = localeContainerRef.current;
            if (container && !container.contains(e.target as Node)) {
                setLocaleOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [localeOpen]);

    if (!sidebar) return null;

    const drawer = (
        <div className={clsx(open && styles.open)} aria-hidden={!open}>
            <div
                className={styles.backdrop}
                onClick={close}
                role="presentation"
            />
            <aside
                className={styles.drawer}
                aria-label={isZH ? '文档目录' : 'Docs sidebar'}
            >
                <div className={styles.header}>
                    <span>{isZH ? '目录' : 'Menu'}</span>
                    <button
                        type="button"
                        className={styles.close}
                        onClick={close}
                        aria-label={isZH ? '关闭目录' : 'Close docs sidebar'}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path
                                d="M5 5l10 10M15 5L5 15"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>
                <nav
                    className={styles.body}
                    aria-label={isZH ? '文档目录导航' : 'Docs sidebar navigation'}
                >
                    <ul className={clsx(ThemeClassNames.docs.docSidebarMenu, 'menu__list', styles.menu)}>
                        <DocSidebarItems
                            items={sidebar.items}
                            activePath={pathname}
                            onItemClick={(item) => {
                                if (item.type === 'link') {
                                    close();
                                }
                                if (item.type === 'category' && item.href) {
                                    close();
                                }
                            }}
                            level={1}
                        />
                    </ul>
                </nav>
            </aside>
        </div>
    );

    return (
        <>
            <div className={styles.toolbar}>
                <div className={styles.toolbarSearch}>
                    <SearchBar />
                </div>
                <div
                    ref={localeContainerRef}
                    className={clsx(styles.toolbarLocale, localeOpen && styles.toolbarLocaleOpen)}
                >
                    <button
                        type="button"
                        className={styles.toolbarIconBtn}
                        onClick={() => setLocaleOpen(o => !o)}
                        aria-label={isZH ? '切换语言' : 'Switch language'}
                        aria-haspopup="true"
                        aria-expanded={localeOpen}
                    >
                        <svg
                            className={styles.toolbarIcon}
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M7.75756 14.3L10.5816 6.91667H11.8759L14.7 14.3H13.4057L12.7501 12.4167H9.74113L9.06873 14.3H7.75756ZM10.1109 11.35H12.3467L11.254 8.3H11.2036L10.1109 11.35ZM2.84908 12.45L1.97498 11.5833L5.11841 8.48333C4.72618 8.05 4.38439 7.60267 4.09302 7.14133C3.80165 6.68044 3.54389 6.19444 3.31976 5.68333H4.61412C4.80463 6.06111 5.00635 6.39711 5.21927 6.69133C5.43219 6.986 5.68434 7.29444 5.97571 7.61667C6.43519 7.12778 6.81621 6.62511 7.11879 6.10867C7.42137 5.59178 7.67352 5.03889 7.87523 4.45H1V3.23333H5.33694V2H6.58087V3.23333H10.9178V4.45H9.11916C8.89503 5.18333 8.59805 5.89155 8.22824 6.57467C7.85842 7.25822 7.39895 7.90555 6.84983 8.51667L8.3459 10.0167L7.87523 11.2833L5.95891 9.38333L2.84908 12.45Z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                    <ul className={styles.localeMenu} role="menu">
                        {locales.map(locale => {
                            const baseTo = alternatePageUtils.createUrl({
                                locale,
                                fullyQualified: false,
                            });
                            const to = `${baseTo}${search}${hash}`;
                            return (
                                <li key={locale} role="none">
                                    <a
                                        role="menuitem"
                                        href={to}
                                        lang={localeConfigs[locale]?.htmlLang}
                                        className={clsx(
                                            styles.localeMenuItem,
                                            locale === currentLocale && styles.localeMenuItemActive,
                                        )}
                                    >
                                        {localeConfigs[locale]?.label ?? locale}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <button
                    type="button"
                    className={styles.toolbarIconBtn}
                    onClick={() => setOpen(true)}
                    aria-label={isZH ? '打开文档目录' : 'Open docs sidebar'}
                    aria-expanded={open}
                >
                    <svg className={styles.toolbarIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {typeof document !== 'undefined' && createPortal(drawer, document.body)}
        </>
    );
}
