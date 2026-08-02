import React, { useState } from 'react';
import { useActivePlugin, useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import BackToTopButton from '@theme/BackToTopButton';
import DocRootLayoutSidebar from '@theme/DocRoot/Layout/Sidebar';
import DocRootLayoutMain from '@theme/DocRoot/Layout/Main';
import type { Props } from '@theme/DocRoot/Layout';

import styles from './styles.module.css';

export default function DocRootLayout({ children }: Props): JSX.Element {
    const sidebar = useDocsSidebar();
    const activePlugin = useActivePlugin();
    const [hiddenSidebarContainer, setHiddenSidebarContainer] = useState(false);
    const isCourse = activePlugin?.pluginId === 'course';

    if (isCourse) {
        return (
            <div className={styles.courseDocsWrapper}>
                <BackToTopButton />
                <main className={styles.courseMain}>{children}</main>
            </div>
        );
    }

    return (
        <div className={styles.docsWrapper}>
            <BackToTopButton />
            <div className={styles.docRoot}>
                {sidebar && (
                    <DocRootLayoutSidebar
                        sidebar={sidebar.items}
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
