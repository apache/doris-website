import React, { useState, useEffect } from 'react';
import Layout from '@site/src/theme/Layout';
import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';
import './index.scss';

const PREVIEW_LINK_ZH = 'https://cdn.selectdb.com/static/doris_1_2_2_18e810982b.pdf';
const PREVIEW_LINK_EN = 'https://cdn.selectdb.com/static/doris_1_2_en_0d0a9b6a03.pdf';

const DATE_LINK = '2025-01-17';

export default function Archive() {
    const [isZH, setIsZH] = useState(false);

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
                id:'archive.layout.description',
                message:'Collection of Apache doris archive documents'
            })}
        >
            <div className="archive-container">
                <h1>
                    <Translate id="archive.page.title">Archived Docs</Translate>
                </h1>
                <div className="archive-admonition">
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
                </div>
                <h2>
                    <Translate id="archive.page.version">Version:1.2</Translate>
                </h2>
                <ul>
                    <li>
                        <Translate
                            id="archive.preview.v12"
                            values={{
                                previewLink: (
                                    <Link
                                        to={isZH ? PREVIEW_LINK_ZH : PREVIEW_LINK_EN}
                                    >
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
                </ul>
            </div>
        </Layout>
    );
}
