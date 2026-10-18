// Shared English footer content. Render this source in every locale so theme
// translations cannot change the global footer.
module.exports = {
    links: [
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
                    label: 'Security',
                    href: 'https://www.apache.org/security/',
                },
                {
                    label: 'Thanks',
                    href: 'https://www.apache.org/foundation/thanks.html',
                },
            ],
        },
        {
            title: 'Resources',
            items: [
                {
                    label: 'Download',
                    href: '/download',
                },
                {
                    label: 'Brand Assets',
                    href: '/brand-assets',
                },
                // {
                //     label: 'Docs',
                //     href: '/docs/get-starting/quick-start',
                // },
                {
                    label: 'Blog',
                    href: '/blog',
                },
            ],
        },
        {
            title: 'Community',
            items: [
                {
                    label: 'How to contribute',
                    href: '/community/how-to-contribute/contribute-to-doris',
                },
                {
                    label: 'Source code',
                    href: 'https://github.com/apache/doris/',
                },
                {
                    label: 'Doris team',
                    href: '/community/team',
                },
                {
                    label: 'Roadmap',
                    href: '/community/roadmap',
                },
                {
                    label: 'Improvement proposal',
                    href: 'https://cwiki.apache.org/confluence/display/DORIS/Doris+Improvement+Proposals',
                },
            ],
        },
    ],
    logo: {
        alt: '',
        src: '/images/asf_logo_apache.svg',
    },
    copyright: `Copyright © ${new Date().getFullYear()} The Apache Software Foundation,Licensed under the <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank">Apache License, Version 2.0</a>. Apache, Doris, Apache Doris, the Apache feather logo and the Apache Doris logo are trademarks of The Apache Software Foundation.`,
};
