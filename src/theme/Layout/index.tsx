import React, { useEffect, createContext, useContext, useState, useRef } from 'react';
import clsx from 'clsx';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { PageMetadata, SkipToContentFallbackId, ThemeClassNames } from '@docusaurus/theme-common';
import { useKeyboardNavigation } from '@docusaurus/theme-common/internal';
import SkipToContent from '@theme/SkipToContent';
import AnnouncementBar from '@theme/AnnouncementBar';
import Navbar from '@theme/Navbar';
import Footer from '@theme/Footer';
import LayoutProvider from '@theme/Layout/Provider';
import ErrorPageContent from '@theme/ErrorPageContent';
import NavbarSearch from '../Navbar/Search';
import SearchBar from '@theme/SearchBar';
import type { Props } from '@theme/Layout';
import styles from './styles.module.css';
import { useHistory } from '@docusaurus/router';

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
    const searchPageDom = useRef<HTMLDivElement>(null);
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
        if (showSearchPageMobile) {
            window.scroll(0,0)
            document.body.style.overflow = 'hidden';
            searchPageDom.current.style.height = '100vh';
        } else {
            window.scroll(0, 0);
            document.body.style.overflow = 'auto';
        }
    }, [showSearchPageMobile]);

    return (
        <DataContext.Provider value={{ showSearchPageMobile, setShowSearchPageMobile }}>
            <LayoutProvider>
                <PageMetadata title={title} description={description} />

                <SkipToContent />
                <AnnouncementBar />
                <Navbar />
                {showSearchPageMobile ? (
                    <div ref={searchPageDom}>
                        <NavbarSearch>
                            <SearchBar />
                        </NavbarSearch>
                    </div>
                ) : null}

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
