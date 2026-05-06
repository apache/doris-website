import React, { useEffect, useState } from 'react';
import Translate, { translate } from '@docusaurus/Translate';
import { PageMetadata } from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import ExternalLink from '../components/external-link/external-link';
import { ExternalLinkArrowIcon } from '@site/src/components/Icons/external-link-arrow-icon';

// Legacy /docs/dev/* URLs may still be linked from external sites. Pages with a
// 1:1 match under /docs-next/dev/ are redirected at build time; pages without
// one land here. Detect the legacy prefix and show guidance to the new Dev docs
// entry instead of the generic 404.
const LEGACY_DEV_GUIDANCE = {
    en: {
        title: 'This Dev doc has moved',
        description:
            'The legacy /docs/dev/ tree has been retired. The page you requested is no longer available at this URL.',
        linkLabel: 'Go to new Dev docs',
        linkTo: '/docs-next/dev/getting-started/what-is-apache-doris',
    },
    'zh-CN': {
        title: 'Dev 文档已迁移',
        description:
            '/docs/dev/ 下的旧文档已下线，此 URL 对应的页面不再可用。请前往新版 Dev 文档继续浏览。',
        linkLabel: '前往新版 Dev 文档',
        linkTo: '/zh-CN/docs-next/dev/getting-started/what-is-apache-doris',
    },
};

function detectLegacyDevLocale(pathname) {
    if (!pathname) return null;
    if (pathname === '/zh-CN/docs/dev' || pathname.startsWith('/zh-CN/docs/dev/')) {
        return 'zh-CN';
    }
    if (pathname === '/docs/dev' || pathname.startsWith('/docs/dev/')) {
        return 'en';
    }
    return null;
}

function LegacyDevGuidance({ locale }) {
    const copy = LEGACY_DEV_GUIDANCE[locale];
    return (
        <main className="container margin-vert--xl">
            <div className="row">
                <div className="col">
                    <div className="flex justify-center mb-10">
                        <img
                            style={{ width: 120 }}
                            src={require('@site/static/images/empty-data.png').default}
                            alt=""
                        />
                    </div>
                    <h1 className="text-[1.75rem] text-[#1D1D1D] leading-[1.6] text-center">
                        {copy.title}
                    </h1>
                    <p className="text-center mt-2 text-sm text-[#8592A6]">
                        {copy.description}
                    </p>
                    <div className="flex justify-center gap-x-6 lg:gap-x-10 mt-10">
                        <div className="w-[12.5rem]">
                            <ExternalLink
                                to={copy.linkTo}
                                label={copy.linkLabel}
                                className="text-sm h-[2.625rem] bg-primary text-white rounded-md hover:text-white cursor-pointer"
                                linkIcon={<ExternalLinkArrowIcon />}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function NotFound() {
    const [legacyDevLocale, setLegacyDevLocale] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setLegacyDevLocale(detectLegacyDevLocale(window.location.pathname));
        }
    }, []);

    return (
        <>
            <PageMetadata
                title={translate({
                    id: 'theme.NotFound.title',
                    message: 'Page Not Found',
                })}
            />
            <Layout>
                {legacyDevLocale ? (
                    <LegacyDevGuidance locale={legacyDevLocale} />
                ) : (
                    <main className="container margin-vert--xl">
                        <div className="row">
                            <div className="col">
                                <div className="flex justify-center mb-10">
                                    <img
                                        style={{ width: 120 }}
                                        src={require('@site/static/images/empty-data.png').default}
                                        alt=""
                                    />
                                </div>
                                <h1 className="text-[1.75rem] text-[#1D1D1D] leading-[1.6] text-center">
                                    <Translate id="theme.NotFound.title" description="The title of the 404 page">
                                        Page Not Found
                                    </Translate>
                                </h1>
                                <p className="text-center mt-2 text-sm text-[#8592A6]">
                                    <Translate id="theme.NotFound.p1" description="The first paragraph of the 404 page">
                                        Oops! The page you are looking for can't be found. In any case, try to look for a
                                        different page or report this issue.
                                    </Translate>
                                </p>
                                <div className="flex justify-center gap-x-6 lg:gap-x-10 mt-10">
                                    <div className="w-[9.75rem]">
                                        <ExternalLink
                                            to="/"
                                            label="Go to home"
                                            className="text-sm h-[2.625rem] bg-primary text-white rounded-md hover:text-white cursor-pointer"
                                            linkIcon={<ExternalLinkArrowIcon />}
                                        />
                                    </div>
                                    <div className="w-[9.75rem]">
                                        <ExternalLink
                                            label="Report this issue"
                                            linkIcon={<ExternalLinkArrowIcon />}
                                            to="https://github.com/apache/doris-website/issues"
                                            className="text-sm border border-primary h-[2.625rem] rounded-md text-primary cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                )}
            </Layout>
        </>
    );
}
