import React, { useEffect } from 'react';
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
import { useHistory } from '@docusaurus/router';
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
        keywords,
        showAnnouncementBar,
    } = props;
    const history = useHistory();
    useKeyboardNavigation();
    const { isTop } = useScrollTop(80);

    useEffect(() => {
        if (
            history.location.pathname?.length > 1 &&
            history.location.pathname[history.location.pathname.length - 1] === '/'
        )
            history.replace(history.location.pathname.slice(0, -1));
    }, []);
    return (
        <Layout>
            <PageMetadata title={title} description={description} keywords={keywords} />

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
