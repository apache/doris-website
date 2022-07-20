import React from 'react';
import clsx from 'clsx';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { PageMetadata, ThemeClassNames, useKeyboardNavigation } from '@docusaurus/theme-common';
import SkipToContent from '@theme/SkipToContent';
import AnnouncementBar from '@theme/AnnouncementBar';
import LayoutProviders from '@theme/LayoutProviders';
import ErrorPageContent from '@theme/ErrorPageContent';
import useScrollTop from '@site/src/hooks/scroll-top-hooks';
import './styles.scss';
import Navbar from '@theme/Navbar';
import Footer from '../Footer';
export default function Layout(props) {
    const {
        children,
        noFooter,
        wrapperClassName,
        // Not really layout-related, but kept for convenience/retro-compatibility
        title,
        description,
        isPage,
    } = props;
    useKeyboardNavigation();
    const { isTop } = useScrollTop(80);

    return (
        <LayoutProviders>
            <PageMetadata title={title} description={description} />

            <SkipToContent />

            <AnnouncementBar />
            <Navbar />
            <div className={clsx(ThemeClassNames.wrapper.main, wrapperClassName, isPage ? 'has-margin' : '')}>
                <ErrorBoundary fallback={params => <ErrorPageContent {...params} />}>{children}</ErrorBoundary>
            </div>
            {!noFooter && <Footer />}
        </LayoutProviders>
    );
}
