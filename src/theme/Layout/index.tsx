import React, { useEffect, createContext, useState, JSX } from 'react';
import { useLocation } from '@docusaurus/router';
import clsx from 'clsx';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { PageMetadata, SkipToContentFallbackId, ThemeClassNames } from '@docusaurus/theme-common';
import { useKeyboardNavigation } from '@docusaurus/theme-common/internal';
import SkipToContent from '@theme/SkipToContent';
import Footer from '@theme/Footer';
import LayoutProvider from '@theme/Layout/Provider';
import ErrorPageContent from '@theme/ErrorPageContent';
import type { Props } from '@theme/Layout';
import styles from './styles.module.css';
import { useHistory } from '@docusaurus/router';
import { NavbarNext } from '@site/src/components/home-next/NavbarNext';

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
