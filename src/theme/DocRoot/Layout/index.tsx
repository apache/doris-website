import React, { useState } from 'react';
import { useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import BackToTopButton from '@theme/BackToTopButton';
import DocRootLayoutSidebar from '@theme/DocRoot/Layout/Sidebar';
import DocRootLayoutMain from '@theme/DocRoot/Layout/Main';
import DocPageBanner from '@theme/DocPageBanner';
import styles from './styles.module.css';

export default function DocRootLayout({ children }) {
    const sidebar = useDocsSidebar();
    const [hiddenSidebarContainer, setHiddenSidebarContainer] = useState(false);
    return (
        <div className={styles.docsWrapper}>
            <BackToTopButton />
            <DocPageBanner />
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