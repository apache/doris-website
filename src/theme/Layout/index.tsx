import React, { useEffect, createContext, useState, JSX } from 'react';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import clsx from 'clsx';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { PageMetadata, SkipToContentFallbackId, ThemeClassNames } from '@docusaurus/theme-common';
import { useKeyboardNavigation } from '@docusaurus/theme-common/internal';
import SkipToContent from '@theme/SkipToContent';
import AnnouncementBar from '@theme/AnnouncementBar';
import Footer from '@theme/Footer';
import LayoutProvider from '@theme/Layout/Provider';
import ErrorPageContent from '@theme/ErrorPageContent';
import type { Props } from '@theme/Layout';
import styles from './styles.module.css';
import { useHistory } from '@docusaurus/router';
import { NavbarNext } from '@site/src/components/home-next/NavbarNext';
import { PreviewBanner } from '@site/src/components/home-next/PreviewBanner';
import { isDevDocsPath, isReleasesPath, isEventsPath, isCommunityPath } from '@site/src/utils/locale';
interface DataType {
    showSearchPageMobile: boolean;
    setShowSearchPageMobile: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DataContext = createContext<DataType>(null);

export default function Layout(props: Props): JSX.Element {
    const {
        children,
        noFooter,
        wrapperClassName,
        // Not really layout-related, but kept for convenience/retro-compatibility
        title,
        description,
    } = props;
    const history = useHistory();
    const [showSearchPageMobile, setShowSearchPageMobile] = useState(false);
    const { hash } = useLocation();
    const {
        i18n: { locales },
    } = useDocusaurusContext();
    // PreviewBanner ("you're viewing the preview — return to classic") is the
    // soft-launch affordance. It still renders on the pages that have always
    // shown it; PR3 removes it together with HomeClassic.
    const isDevDocsPage = isDevDocsPath(history.location.pathname, locales);
    const isReleasesPage = isReleasesPath(history.location.pathname, locales);
    const isEventsPage = isEventsPath(history.location.pathname, locales);
    const isCommunityPage = isCommunityPath(history.location.pathname, locales);
    const showPreviewBanner = isDevDocsPage || isReleasesPage || isEventsPage || isCommunityPage;
    useKeyboardNavigation();

    useEffect(() => {
        if (
            history.location.pathname?.length > 1 &&
            history.location.pathname[history.location.pathname.length - 1] === '/'
        ) {
            const params = location.href.split(history.location.pathname)[1];
            history.replace(history.location.pathname.slice(0, -1) + params);
        }
    }, [history.location]);

    useEffect(() => {
        window.scroll(0, 0);
        document.body.style.overflow = 'auto';
    }, [history.location]);

    useEffect(() => {
        if (hash) {
            try {
                const decodeHash = decodeURIComponent(hash);
                const targetElement = document.querySelector(decodeHash);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (err) {
                console.error(err);
            }
        }
    }, [hash]);

    return (
        <DataContext.Provider value={{ showSearchPageMobile, setShowSearchPageMobile }}>
            <LayoutProvider>
                <PageMetadata title={title} description={description} />

                <SkipToContent />
                <AnnouncementBar />
                {showPreviewBanner && <PreviewBanner />}
                <NavbarNext />

                <div
                    id={SkipToContentFallbackId}
                    className={clsx(ThemeClassNames.wrapper.main, styles.mainWrapper, wrapperClassName)}
                >
                    <ErrorBoundary fallback={params => <ErrorPageContent {...params} />}>{children}</ErrorBoundary>
                </div>

                {!noFooter && <Footer />}
            </LayoutProvider>
        </DataContext.Provider>
    );
}
