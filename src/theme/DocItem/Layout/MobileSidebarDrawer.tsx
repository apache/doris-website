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
                            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
                            <path
                                d="M1.5 8h13M8 1.5c1.75 1.78 2.7 4.03 2.7 6.5s-.95 4.72-2.7 6.5C6.25 12.72 5.3 10.47 5.3 8S6.25 3.28 8 1.5Z"
                                stroke="currentColor"
                                strokeWidth="1.25"
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
