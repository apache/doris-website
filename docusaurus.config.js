// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion
// @ts-ignore
const versions = require('./versions.json');
const lightCodeTheme = require('prism-react-renderer/themes/github');
const showAllVersions = false;
const { ssrTemplate } = require('./config/ssrTemplate');
const customDocusaurusPlugin = require('./config/custom-docusaurus-plugin');
const versionsPlugin = require('./config/versions-plugin');

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'Apache Doris',
    titleDelimiter: '-',
    tagline: 'Apache Doris',
    url: 'https://doris.apache.org',
    baseUrl: '/',
    onBrokenLinks: 'ignore',
    onBrokenMarkdownLinks: 'ignore',
    favicon: 'images/favicon.ico',
    i18n: {
        defaultLocale: 'en',
        locales: ['en', 'zh-CN'],
        localeConfigs: {
            en: {
                label: 'EN',
            },
            'zh-CN': {
                label: '中文',
            },
        },
    },
    // scripts: ['/js/redirect.js'],
    stylesheets: [
        'https://fonts.googleapis.com/css?family=Montserrat:500',
        'https://fonts.googleapis.com/css?family=Noto+Sans+SC:400',
    ],
    organizationName: 'doris', // Usually your GitHub org/user name.
    projectName: 'doris', // Usually your repo name.
    plugins: [
        'docusaurus-plugin-sass',
        versionsPlugin,
        [
            'content-docs',
            /** @type {import('@docusaurus/plugin-content-docs').Options} */
            ({
                id: 'community',
                path: 'community',
                routeBasePath: '/community',
                sidebarPath: require.resolve('./sidebarsCommunity.json'),
            }),
        ],
        process.env.NODE_ENV === 'development' ? null : customDocusaurusPlugin,
        [
            '@docusaurus/plugin-pwa',
            {
                debug: false,
                offlineModeActivationStrategies: ['standalone', 'queryString', 'mobile'],
                injectManifestConfig: {
                    globPatterns: ['**/*.{json,pdf,docx,xlsx,html,css,js,png,svg,ico,jpg,jpeg}'],
                },
                pwaHead: [
                    {
                        tagName: 'link',
                        rel: 'icon',
                        href: '/images/logo-only.png',
                    },
                    {
                        tagName: 'link',
                        rel: 'manifest',
                        href: '/manifest.json',
                    },
                    {
                        tagName: 'meta',
                        name: 'theme-color',
                        content: '#FFFFFF',
                    },
                    {
                        tagName: 'meta',
                        name: 'apple-mobile-web-app-capable',
                        content: 'yes',
                    },
                    {
                        tagName: 'meta',
                        name: 'apple-mobile-web-app-status-bar-style',
                        content: '#000',
                    },
                    {
                        tagName: 'link',
                        rel: 'apple-touch-icon',
                        href: '/img/docusaurus.png',
                    },
                    {
                        tagName: 'link',
                        rel: 'mask-icon',
                        href: '/img/docusaurus.svg',
                        color: 'rgb(37, 194, 160)',
                    },
                    {
                        tagName: 'meta',
                        name: 'msapplication-TileImage',
                        content: '/img/docusaurus.png',
                    },
                    {
                        tagName: 'meta',
                        name: 'msapplication-TileColor',
                        content: '#000',
                    },
                ],
            },
        ],
    ],
    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    // lastVersion: 'current',
                    versions: {
                        current: {
                            label: '1.1',
                            path: '',
                            badge: false,
                        },
                        0.15: {
                            banner: 'none',
                            badge: false,
                        },
                        dev: {
                            path: '/dev',
                            banner: 'none',
                            badge: false,
                        },
                    },
                    sidebarPath: require.resolve('./sidebars.json'),
                    // onlyIncludeVersions:
                    //     process.env.NODE_ENV === 'development' && !showAllVersions
                    //         ? ['current']
                    //         : ['current', ...versions],
                    editUrl: ({ locale, versionDocsDirPath, docPath }) => {
                        if (versionDocsDirPath === 'versioned_docs/version-dev') {
                            return `https://github.com/apache/doris/edit/master/docs/${locale}/docs/${docPath}`;
                        }
                    },
                    showLastUpdateAuthor: false,
                    showLastUpdateTime: false,
                },
                blog: {
                    blogTitle: 'Blog',
                    blogDescription: 'Apache Doris Blog',
                    postsPerPage: 'ALL',
                    blogSidebarCount: 0,
                    showReadingTime: false,
                },
                theme: {
                    customCss: require.resolve('./src/scss/custom.scss'),
                },
                gtag: {
                    trackingID: 'G-DT7W9E9722',
                    anonymizeIP: true,
                },
            }),
        ],
    ],
    themes: [
        [
            '@easyops-cn/docusaurus-search-local',
            {
                hashed: true,
                language: ['en', 'zh'],
                highlightSearchTermsOnTargetPage: true,
                // indexPages: true,
                indexDocs: true,
                indexBlog: false,
                explicitSearchResultPath: true,
            },
        ],
    ],
    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            navbar: {
                title: '',
                logo: {
                    alt: 'Doris',
                    src: 'https://cdn-tencent.selectdb.com/images/logo.svg',
                },
                items: [
                    { to: '/', label: 'Home', position: 'left', exact: true },
                    {
                        type: 'doc',
                        position: 'left',
                        label: 'Docs',
                        docId: 'summary/basic-summary',
                        to: '/basic-summary',
                    },
                    { to: '/blog', label: 'Blog', position: 'left' },
                    {
                        label: 'Community',
                        type: 'doc',
                        docId: 'team',
                        position: 'left',
                        docsPluginId: 'community',
                    },
                    { to: '/users', label: 'Users', position: 'left' },
                    // {
                    //     type: 'docsVersionDropdown',
                    //     position: 'right',
                    // },
                    {
                        type: 'localeDropdown',
                        position: 'right',
                    },
                    // {
                    //     href: 'https://github.com/apache/doris',
                    //     className: 'header-right-button-github',
                    //     position: 'right',
                    //     label: 'GitHub',
                    // },
                    {
                        href: '/download',
                        className: 'header-right-button-primary navbar-download-mobile',
                        label: 'Download',
                        position: 'right',
                    },
                ],
            },
            footer: {
                links: [
                    {
                        title: 'Resource',
                        items: [
                            {
                                label: 'Download',
                                href: '/download',
                            },
                            {
                                label: 'Docs',
                                href: '/learning',
                            },
                        ],
                    },
                    {
                        title: 'ASF',
                        items: [
                            {
                                label: 'Foundation',
                                href: 'https://www.apache.org/',
                            },
                            {
                                label: 'License',
                                href: 'https://www.apache.org/licenses/',
                            },
                            {
                                label: 'Events',
                                href: 'https://www.apache.org/events/current-event',
                            },
                            {
                                label: 'Sponsorship',
                                href: 'https://www.apache.org/foundation/sponsorship.html',
                            },
                            {
                                label: 'Privacy',
                                href: 'https://privacy.apache.org/policies/privacy-policy-public.html',
                            },
                            {
                                label: 'Thanks',
                                href: 'https://www.apache.org/foundation/thanks.html',
                            },
                        ],
                    },
                ],
                logo: {
                    alt: '',
                    src: '/images/asf_logo_apache.svg',
                },
                copyright: `Copyright © ${new Date().getFullYear()} The Apache Software Foundation,Licensed under the <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank">Apache License, Version 2.0</a>. Apache, Doris, Apache Doris, the Apache feather logo and the Apache Doris logo are trademarks of The Apache Software Foundation.`,
            },
            docs: {
                sidebar: {
                    autoCollapseCategories: true,
                },
            },
            prism: {
                theme: lightCodeTheme,
                additionalLanguages: ['java'],
            },
            colorMode: {
                disableSwitch: true,
            },
            // metadata: [
            //     {
            //         name: 'viewport',
            //         content:
            //             'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no',
            //     },
            // ],
        }),
    ssrTemplate,
};

module.exports = config;
