import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useWindowSize } from '@docusaurus/theme-common';
import { useDoc } from '@docusaurus/theme-common/internal';
import Link from '@docusaurus/Link';
import DocItemPaginator from '@theme/DocItem/Paginator';
import DocVersionBanner from '@theme/DocVersionBanner';
import { DocsEdit } from '../../../components/Icons/docs-edit';
import { DocsAttention } from '../../../components/Icons/docs-attention';
import DocVersionBadge from '@theme/DocVersionBadge';
import DocItemFooter from '@theme/DocItem/Footer';
import DocItemTOCMobile from '@theme/DocItem/TOC/Mobile';
import DocItemTOCDesktop from '@theme/DocItem/TOC/Desktop';
import DocItemContent from '@theme/DocItem/Content';
import DocBreadcrumbs from '@theme/DocBreadcrumbs';
import type { Props } from '@theme/DocItem/Layout';
import { generateUrl } from './pathTransfer';

import styles from './styles.module.css';
import EditThisPage from '../../EditThisPage';

/**
 * Decide if the toc should be rendered, on mobile or desktop viewports
 */
function useDocTOC() {
    const { frontMatter, toc } = useDoc();
    const windowSize = useWindowSize();

    const hidden = frontMatter.hide_table_of_contents;
    const canRender = !hidden && toc.length > 0;

    const mobile = canRender ? <DocItemTOCMobile /> : undefined;

    const desktop = canRender && (windowSize === 'desktop' || windowSize === 'ssr') ? <DocItemTOCDesktop /> : undefined;

    return {
        hidden,
        mobile,
        desktop,
    };
}

export default function DocItemLayout({ children }: Props): JSX.Element {
    const docTOC = useDocTOC();
    const { metadata } = useDoc();
    const [isNew, setIsNew] = useState(true);
    const [showBanner, setShowBanner] = useState(false);
    const [isZH, setIsZH] = useState(false);
    const { editUrl, lastUpdatedAt, formattedLastUpdatedAt, lastUpdatedBy, tags } = metadata;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const notBanner = ['gettingStarted','benchmark','ecosystem','faq','releasenotes']
            const isShow = notBanner.some(item => location.pathname.includes(item))
            setIsNew(location.pathname.includes('what-is-new'));
            setIsZH(location.pathname.includes('zh-CN'));
            setShowBanner(!isShow);
        }
    }, [typeof window !== 'undefined' && location.pathname]);
    return (
        <div className="row">
            <div className={clsx('col', !docTOC.hidden && styles.docItemCol)}>
                {showBanner && <DocVersionBanner />}
                <div className={styles.docItemContainer}>
                    <article>
                        <DocBreadcrumbs />
                        <DocVersionBadge />
                        {docTOC.mobile}
                        <DocItemContent>{children}</DocItemContent>
                        <DocItemFooter />
                    </article>
                    <div className="flex items-center justify-end col mt-10">
                        {isNew ? (
                            <></>
                        ) : (
                            <Link to={generateUrl(location.pathname)} className={`mr-6 ${styles.footerBtn}`}>
                                <DocsEdit /> <span className="ml-2">{isZH ? '编辑本页' : 'Edit this page'}</span>
                            </Link>
                        )}
                        <Link
                            to={`https://github.com/apache/doris-website/issues/new?title=Issue on docs&body=Path:${typeof window !== 'undefined' && location.pathname}`}
                            className={`mr-6 ${styles.footerBtn}`}
                        >
                            <DocsAttention /> <span className="ml-2">{isZH ? '反馈问题' : 'Report issue'}</span>
                        </Link>
                    </div>
                    <DocItemPaginator />
                </div>
            </div>
            {docTOC.desktop && (
                <div className="col col--3">
                    {/* <div
                        style={{
                            paddingLeft: 20,
                        }}
                    >
                        <EditThisPage editUrl={editUrl} />
                    </div> */}
                    {docTOC.desktop}
                </div>
            )}
        </div>
    );
}
