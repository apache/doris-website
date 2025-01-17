import React, { useState, useEffect } from 'react';
import Layout from '@site/src/theme/Layout';
import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';
import './index.scss';

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
                id: 'download.title',
                message: 'Apache Doris - Download | Easily deploy Doris anywhere',
            })}
            description={translate({
                id: 'homepage.banner.subTitle',
                message:
                    'Download and explore precompiled binaries of different verisons. Apache Doris connects any device, at any scale, anywhere.',
            })}
            wrapperClassName="download"
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
                                        <Translate id="archive.admonition.stable">stable version</Translate>
                                    </Link>
                                ),
                                latestLink: (
                                    <Link to={`/${isZH ? 'zh-CN/' : ''}docs/3.0/gettingStarted/what-is-apache-doris`}>
                                        <Translate id="archive.admonition.latest">latest version</Translate>
                                    </Link>
                                ),
                            }}
                        >
                            {'For up-to-date documentation,see the {stableLink}(2.1) and {latestLink}(3.0)'}
                        </Translate>
                    </p>
                </div>
                <h2>
                    <Translate id="archive.page.version">Version:1.2</Translate>
                </h2>
                <ul>
                    <li>pdf</li>
                </ul>
            </div>
        </Layout>
    );
}
