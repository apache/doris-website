import React, { type JSX, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useLocation } from '@docusaurus/router';
import { useActivePlugin, useActiveVersion, useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import BackToTopButton from '@theme/BackToTopButton';
import DocRootLayoutSidebar from '@theme/DocRoot/Layout/Sidebar';
import DocRootLayoutMain from '@theme/DocRoot/Layout/Main';
import DocsDomainNav from '@site/src/components/docs-domain-nav/DocsDomainNav';
import { getDocsSidebarScope, supportsDocsDomainNavigation } from '@site/src/utils/docs-sidebar-scope';
import type { Props } from '@theme/DocRoot/Layout';

import styles from './styles.module.css';

export default function DocRootLayout({ children }: Props): JSX.Element {
    const sidebar = useDocsSidebar();
    const activePlugin = useActivePlugin();
    const activeVersion = useActiveVersion(activePlugin?.pluginId);
    const { pathname } = useLocation();
    const [hiddenSidebarContainer, setHiddenSidebarContainer] = useState(false);
    const isCourse = activePlugin?.pluginId === 'course';
    const usesDomainNavigation = supportsDocsDomainNavigation(activePlugin?.pluginId, activeVersion?.name);
    const sidebarScope = useMemo(
        () => sidebar ? getDocsSidebarScope(sidebar.items, pathname) : undefined,
        [pathname, sidebar],
    );
    const showDomainNav = Boolean(usesDomainNavigation && sidebarScope && sidebarScope.domains.length > 1);

    if (isCourse) {
        return (
            <div className={styles.courseDocsWrapper}>
                <BackToTopButton />
                <main className={styles.courseMain}>{children}</main>
            </div>
        );
    }

    return (
        <div className={clsx(styles.docsWrapper, showDomainNav && styles.docsWithDomainNav)}>
            <BackToTopButton />
            {showDomainNav && sidebarScope && (
                <DocsDomainNav
                    docsPluginId={activePlugin!.pluginId}
                    domains={sidebarScope.domains}
                />
            )}
            <div className={styles.docRoot}>
                {sidebar && (
                    <DocRootLayoutSidebar
                        sidebar={showDomainNav && sidebarScope ? sidebarScope.scopedItems : sidebar.items}
                        hiddenSidebarContainer={hiddenSidebarContainer}
                        setHiddenSidebarContainer={setHiddenSidebarContainer}
                    />
                )}
                <DocRootLayoutMain hiddenSidebarContainer={hiddenSidebarContainer}>
                    {children}
                </DocRootLayoutMain>
            </div>
        </div>
    );
}
