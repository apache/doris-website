import React, { useState, useEffect } from 'react';
import Layout from '@site/src/theme/Layout';
import Link from '@docusaurus/Link';
import { Divider } from 'antd';
import Translate, { translate } from '@docusaurus/Translate';
import PdfIcon from '@site/static/images/toc-icon/pdf.svg';
import './index.scss';

const PREVIEW_LINK_ZH = 'https://cdn.selectdb.com/static/doris_1_2_2_18e810982b.pdf';
const PREVIEW_LINK_EN = 'https://cdn.selectdb.com/static/doris_1_2_en_0d0a9b6a03.pdf';

const DATE_LINK = '2025-01-17';

export default function Archive() {
    const [isZH, setIsZH] = useState(false);
    const handleMouseEnter = (id: string) => {
        const dom = document.getElementById(id);
        dom!.style.color = '#1FCD94';
        dom!.firstChild!.style.fill = '#1FCD94';
    };

    const handleMouseLeave = (id: string) => {
        const dom = document.getElementById(id);
        dom!.style.color = '#7F7F83';
        dom!.firstChild!.style.fill = '#7F7F83';
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsZH(location.pathname.includes('zh-CN'));
        }
    }, [typeof window !== 'undefined' && location.pathname]);
    return (
        <Layout
            title={translate({
                id: 'archive.layout.title',
                message: 'Apache Doris - Archive Document Center',
            })}
            description={translate({
                id: 'archive.layout.description',
                message: 'Collection of Apache doris archive documents',
            })}
        >
            <div className="archive-container">
                <h1>
                    <Translate id="archive.page.title">Archived Docs</Translate>
                </h1>
                {/* <div className="archive-admonition">
                    <p>
                        <Translate id="archive.admonition.1">
                            The older releases are provided for archival purposes only, and are no longer receives
                            updates.
                        </Translate>
                    </p>
                    <p>
                        <Translate
                            id="archive.page.2"
                            values={{
                                stableLink: (
                                    <Link to={`/${isZH ? 'zh-CN/' : ''}docs/gettingStarted/what-is-apache-doris`}>
                                        <Translate id="archive.admonition.stable">version(2.1)</Translate>
                                    </Link>
                                ),
                                latestLink: (
                                    <Link to={`/${isZH ? 'zh-CN/' : ''}docs/3.0/gettingStarted/what-is-apache-doris`}>
                                        <Translate id="archive.admonition.latest">version(3.0)</Translate>
                                    </Link>
                                ),
                            }}
                        >
                            {'For up-to-date documentation,please see the {stableLink} or {latestLink}'}
                        </Translate>
                    </p>
                </div> */}
                {/* <h2>
                    <Translate id="archive.page.version">Version:1.2</Translate>
                </h2>
                <ul>
                    <li>
                        <Translate
                            id="archive.preview.v12"
                            values={{
                                previewLink: (
                                    <Link to={isZH ? PREVIEW_LINK_ZH : PREVIEW_LINK_EN}>
                                        <Translate id="archive.preview.link">Apache Doris v1.2</Translate>
                                    </Link>
                                ),
                            }}
                        >
                            {'Archived documentation: {previewLink}'}
                        </Translate>{' '}
                    </li>
                    <li>
                        <Translate
                            id="archive.preview.date"
                            values={{
                                date: <span>{DATE_LINK}</span>,
                            }}
                        >
                            {'Archive date: {date}'}
                        </Translate>
                    </li>
                </ul> */}
                <p className="archive-tips-content">
                    <Translate id="archive-tips-1">
                        This page archives all documents of Apache Doris's discontinued maintenance versions and
                        provides PDF format for users to download.
                    </Translate>
                    <br />
                    <br />
                    <Translate
                        id="archive-tips-2"
                        values={{
                            latestVersion: (
                                <Link className='latest-version-link' to={`/${isZH ? 'zh-CN/' : ''}docs/3.x/gettingStarted/what-is-apache-doris`}>
                                    <Translate id="archive.latest.version">latest version</Translate>
                                </Link>
                            ),
                        }}
                    >
                        {
                            'Please note that archived documents no longer receive updates; therefore, Doris encourages you to use the {latestVersion}.'
                        }
                    </Translate>
                </p>
                <div className="preview-item-content">
                    <div className="preview-item-version">Apache Doris v1.2</div>
                    <Link to={isZH ? PREVIEW_LINK_ZH : PREVIEW_LINK_EN}>
                        <div
                            className="preview-link"
                            style={{ color: '#7F7F83' }}
                            id="toc-icon-pdf"
                            onMouseEnter={() => handleMouseEnter('toc-icon-pdf')}
                            onMouseLeave={() => handleMouseLeave('toc-icon-pdf')}
                        >
                            <PdfIcon />
                            <Translate id="archive-download-text">Download PDF</Translate>
                        </div>
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
