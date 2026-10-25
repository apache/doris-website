import {translate} from '@docusaurus/Translate';
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
        name: translate({id: "landing.brandassets.001", message: "Doris Logo - Horizontal"}),
        description: translate({id: "landing.brandassets.002", message: "Primary Doris logo for light backgrounds."}),
        fileName: 'doris-logo-horizontal-primary.svg',
        previewTheme: 'light',
    },
    {
        name: translate({id: "landing.brandassets.003", message: "Doris Logo - Stacked"}),
        description: translate({id: "landing.brandassets.004", message: "Centered Doris logo for light backgrounds."}),
        fileName: 'doris-logo-stacked-primary.svg',
        previewTheme: 'light',
    },
    {
        name: translate({id: "landing.brandassets.005", message: "Doris Logo - Horizontal Dark"}),
        description: translate({id: "landing.brandassets.006", message: "Doris logo with white wordmark for dark backgrounds."}),
        fileName: 'doris-logo-horizontal-dark.svg',
        previewTheme: 'dark',
    },
    {
        name: translate({id: "landing.brandassets.007", message: "Doris Logo - Stacked Dark"}),
        description: translate({id: "landing.brandassets.008", message: "Centered Doris logo with white wordmark for dark backgrounds."}),
        fileName: 'doris-logo-stacked-dark.svg',
        previewTheme: 'dark',
    },
    {
        name: translate({id: "landing.brandassets.009", message: "Doris Logo - Horizontal White"}),
        description: translate({id: "landing.brandassets.010", message: "Single-color Doris logo for dark backgrounds."}),
        fileName: 'doris-logo-horizontal-white.svg',
        previewTheme: 'dark',
    },
    {
        name: translate({id: "landing.brandassets.011", message: "Doris Logo - Stacked White"}),
        description: translate({id: "landing.brandassets.012", message: "Centered single-color Doris logo for dark backgrounds."}),
        fileName: 'doris-logo-stacked-white.svg',
        previewTheme: 'dark',
    },
    {
        name: translate({id: "landing.brandassets.013", message: "Apache Doris Logo - Horizontal"}),
        description: translate({id: "landing.brandassets.014", message: "Primary Apache Doris logo for light backgrounds."}),
        fileName: 'apache-doris-logo-horizontal-primary.svg',
        previewTheme: 'light',
    },
    {
        name: translate({id: "landing.brandassets.015", message: "Apache Doris Logo - Stacked"}),
        description: translate({id: "landing.brandassets.016", message: "Centered Apache Doris logo for light backgrounds."}),
        fileName: 'apache-doris-logo-stacked-primary.svg',
        previewTheme: 'light',
    },
    {
        name: translate({id: "landing.brandassets.017", message: "Apache Doris Logo - Horizontal Dark"}),
        description: translate({id: "landing.brandassets.018", message: "Apache Doris logo with white wordmark for dark backgrounds."}),
        fileName: 'apache-doris-logo-horizontal-dark.svg',
        previewTheme: 'dark',
    },
    {
        name: translate({id: "landing.brandassets.019", message: "Apache Doris Logo - Stacked Dark"}),
        description: translate({id: "landing.brandassets.020", message: "Centered Apache Doris logo with white wordmark for dark backgrounds."}),
        fileName: 'apache-doris-logo-stacked-dark.svg',
        previewTheme: 'dark',
    },
    {
        name: translate({id: "landing.brandassets.021", message: "Apache Doris Logo - Horizontal White"}),
        description: translate({id: "landing.brandassets.022", message: "Single-color Apache Doris logo for dark backgrounds."}),
        fileName: 'apache-doris-logo-horizontal-white.svg',
        previewTheme: 'dark',
    },
    {
        name: translate({id: "landing.brandassets.023", message: "Apache Doris Logo - Stacked White"}),
        description: translate({id: "landing.brandassets.024", message: "Centered single-color Apache Doris logo for dark backgrounds."}),
        fileName: 'apache-doris-logo-stacked-white.svg',
        previewTheme: 'dark',
    },
];

export default function BrandAssetsPage(): React.ReactElement {
    return (
        <Layout
            title={translate({id: "landing.brandassets.025", message: "Brand Assets - Apache Doris"})}
            description={translate({id: "landing.brandassets.026", message: "Download official Apache Doris logo and brand SVG assets."})}
        >
            <main className="brand-assets">
                <section className="brand-assets__hero">
                    <div className="container">
                        <p className="brand-assets__eyebrow">{translate({id: "landing.brandassets.027", message: "Resources"})}</p>
                        <h1>{translate({id: "landing.brandassets.028", message: "Brand Assets"})}</h1>
                        <p className="brand-assets__intro">
                            {translate({id: "landing.brandassets.029", message: "Download official Apache Doris SVG assets for articles, presentations, community events, integrations, and other materials that reference the project."})}
                        </p>
                    </div>
                </section>

                <section className="brand-assets__content">
                    <div className="container">
                        <div className="brand-assets__notice" role="note">
                            {translate({id: "landing.brandassets.030", message: "Apache Doris, Doris, and the Doris logo are trademarks of The Apache Software Foundation. Use these assets to refer to Apache Doris clearly and accurately."})}
                        </div>

                        <div className="brand-assets__grid">
                            {brandAssets.map(asset => {
                                const assetPath = `${ASSET_BASE_PATH}/${asset.fileName}`;

                                return (
                                    <article className="brand-assets__card" key={asset.fileName}>
                                        <div
                                            className={`brand-assets__preview brand-assets__preview--${asset.previewTheme}`}
                                        >
                                            <img src={assetPath} alt={`${asset.name}${translate({id: "landing.brandassets.031", message: " preview"})}`} loading="lazy" />
                                        </div>
                                        <div className="brand-assets__card-body">
                                            <div>
                                                <h2>{asset.name}</h2>
                                                <p>{asset.description}</p>
                                            </div>
                                            <div className="brand-assets__card-footer">
                                                <span>SVG</span>
                                                <a href={assetPath} download={asset.fileName}>
                                                    {translate({id: "landing.brandassets.032", message: "Download"})}
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
