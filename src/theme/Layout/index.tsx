import React from 'react';
import clsx from 'clsx';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { PageMetadata, ThemeClassNames } from '@docusaurus/theme-common';
import { useKeyboardNavigation } from '@docusaurus/theme-common/internal';
import SkipToContent from '@theme/SkipToContent';
import Layout from '@theme-original/Layout';
import ErrorPageContent from '@theme/ErrorPageContent';
import useScrollTop from '@site/src/hooks/scroll-top-hooks';
import './styles.scss';
import AnnouncementBar from '../AnnouncementBar';
// import Navbar from '@theme/Navbar';
// import Footer from '../Footer';
export default function CustomLayout(props) {
    const {
        children,
        noFooter,
        wrapperClassName,
        // Not really layout-related, but kept for convenience/retro-compatibility
        title,
        description,
        isPage,
        showAnnouncementBar,
    } = props;
    useKeyboardNavigation();
    const { isTop } = useScrollTop(80);

    return (
        <Layout>
            <PageMetadata title={title} description={description} />

            <SkipToContent />

            {/* {showAnnouncementBar && <AnnouncementBar />} */}
            {/* <Navbar /> */}
            <div className={clsx(ThemeClassNames.wrapper.main, wrapperClassName, isPage ? 'has-margin' : '')}>
                <ErrorBoundary fallback={params => <ErrorPageContent {...params} />}>{children}</ErrorBoundary>
            </div>
            {/* {!noFooter && <Footer />} */}
        </Layout>
    );
}
