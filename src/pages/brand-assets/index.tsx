import React from 'react';
import Layout from '../../theme/Layout';
import './index.scss';

type PreviewTheme = 'light' | 'dark';

interface BrandAsset {
    name: string;
    description: string;
    fileName: string;
    previewTheme: PreviewTheme;
}

const ASSET_BASE_PATH = '/images/brand-assets';

const brandAssets: BrandAsset[] = [
    {
        name: 'Doris Logo - Horizontal',
        description: 'Primary Doris logo for light backgrounds.',
        fileName: 'doris-logo-horizontal-primary.svg',
        previewTheme: 'light',
    },
    {
        name: 'Doris Logo - Stacked',
        description: 'Centered Doris logo for light backgrounds.',
        fileName: 'doris-logo-stacked-primary.svg',
        previewTheme: 'light',
    },
    {
        name: 'Doris Logo - Horizontal Dark',
        description: 'Doris logo with white wordmark for dark backgrounds.',
        fileName: 'doris-logo-horizontal-dark.svg',
        previewTheme: 'dark',
    },
    {
        name: 'Doris Logo - Stacked Dark',
        description: 'Centered Doris logo with white wordmark for dark backgrounds.',
        fileName: 'doris-logo-stacked-dark.svg',
        previewTheme: 'dark',
    },
    {
        name: 'Doris Logo - Horizontal White',
        description: 'Single-color Doris logo for dark backgrounds.',
        fileName: 'doris-logo-horizontal-white.svg',
        previewTheme: 'dark',
    },
    {
        name: 'Doris Logo - Stacked White',
        description: 'Centered single-color Doris logo for dark backgrounds.',
        fileName: 'doris-logo-stacked-white.svg',
        previewTheme: 'dark',
    },
    {
        name: 'Apache Doris Logo - Horizontal',
        description: 'Primary Apache Doris logo for light backgrounds.',
        fileName: 'apache-doris-logo-horizontal-primary.svg',
        previewTheme: 'light',
    },
    {
        name: 'Apache Doris Logo - Stacked',
        description: 'Centered Apache Doris logo for light backgrounds.',
        fileName: 'apache-doris-logo-stacked-primary.svg',
        previewTheme: 'light',
    },
    {
        name: 'Apache Doris Logo - Horizontal Dark',
        description: 'Apache Doris logo with white wordmark for dark backgrounds.',
        fileName: 'apache-doris-logo-horizontal-dark.svg',
        previewTheme: 'dark',
    },
    {
        name: 'Apache Doris Logo - Stacked Dark',
        description: 'Centered Apache Doris logo with white wordmark for dark backgrounds.',
        fileName: 'apache-doris-logo-stacked-dark.svg',
        previewTheme: 'dark',
    },
    {
        name: 'Apache Doris Logo - Horizontal White',
        description: 'Single-color Apache Doris logo for dark backgrounds.',
        fileName: 'apache-doris-logo-horizontal-white.svg',
        previewTheme: 'dark',
    },
    {
        name: 'Apache Doris Logo - Stacked White',
        description: 'Centered single-color Apache Doris logo for dark backgrounds.',
        fileName: 'apache-doris-logo-stacked-white.svg',
        previewTheme: 'dark',
    },
];

export default function BrandAssetsPage(): React.ReactElement {
    return (
        <Layout
            title="Brand Assets - Apache Doris"
            description="Download official Apache Doris logo and brand SVG assets."
        >
            <main className="brand-assets">
                <section className="brand-assets__hero">
                    <div className="container">
                        <p className="brand-assets__eyebrow">Resources</p>
                        <h1>Brand Assets</h1>
                        <p className="brand-assets__intro">
                            Download official Apache Doris SVG assets for articles, presentations, community events,
                            integrations, and other materials that reference the project.
                        </p>
                    </div>
                </section>

                <section className="brand-assets__content">
                    <div className="container">
                        <div className="brand-assets__notice" role="note">
                            Apache Doris, Doris, and the Doris logo are trademarks of The Apache Software Foundation.
                            Use these assets to refer to Apache Doris clearly and accurately.
                        </div>

                        <div className="brand-assets__grid">
                            {brandAssets.map(asset => {
                                const assetPath = `${ASSET_BASE_PATH}/${asset.fileName}`;

                                return (
                                    <article className="brand-assets__card" key={asset.fileName}>
                                        <div
                                            className={`brand-assets__preview brand-assets__preview--${asset.previewTheme}`}
                                        >
                                            <img src={assetPath} alt={`${asset.name} preview`} loading="lazy" />
                                        </div>
                                        <div className="brand-assets__card-body">
                                            <div>
                                                <h2>{asset.name}</h2>
                                                <p>{asset.description}</p>
                                            </div>
                                            <div className="brand-assets__card-footer">
                                                <span>SVG</span>
                                                <a href={assetPath} download={asset.fileName}>
                                                    Download
                                                </a>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>
        </Layout>
    );
}
