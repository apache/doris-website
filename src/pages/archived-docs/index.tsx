import React, {type JSX} from 'react';
import {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import Link from '@site/src/components/home-next/LocalizedLink';
import archive from '@site/config/archived-docs.json';
import './styles.scss';

export default function ArchivedDocs(): JSX.Element {
    const title = translate({id: 'docs.archive.title', message: 'Archived Versions'});
    const description = translate({id: 'docs.archive.description', message: 'Download PDF documentation for archived Apache Doris versions.'});
    return (
        <Layout title={title} description={description}>
            <main className="archived-docs">
                <header>
                    <p className="archived-docs__eyebrow">APACHE DORIS</p>
                    <h1>{title}</h1>
                    <p>{description}</p>
                    <p>{translate({id: 'docs.archive.notice', message: 'These documentation versions are no longer updated. Each PDF contains the complete documentation for the selected version and language.'})}</p>
                    <Link className="archived-docs__current" to="/docs/4.x/getting-started/what-is-apache-doris">
                        {translate({id: 'docs.archive.current', message: 'Read the current stable documentation'})} <span aria-hidden="true">→</span>
                    </Link>
                </header>
                <section aria-label={title} className="archived-docs__versions">
                    {archive.versions.map(version => (
                        <article key={version} id={`version-${version}`} className="archived-docs__version">
                            <h2>Apache Doris {version}</h2>
                            <div className="archived-docs__downloads">
                                {archive.locales.map(locale => {
                                    const filename = `apache-doris-${version}-${locale}.pdf`;
                                    return <a key={locale} href={`${archive.baseUrl.replace(/\/$/, '')}/${filename}`} download={filename}
                                        aria-label={`Apache Doris ${version} · ${locale === 'en' ? 'English' : '中文'} · PDF`}>
                                        <span lang={locale}>{locale === 'en' ? 'English' : '中文'}</span>
                                        <span className="archived-docs__format">PDF <span aria-hidden="true">↓</span></span>
                                    </a>;
                                })}
                            </div>
                        </article>
                    ))}
                </section>
            </main>
        </Layout>
    );
}
