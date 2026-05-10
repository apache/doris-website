import React, { useEffect, useState } from 'react';
import Translate from '@docusaurus/Translate';
import ExternalLink from '@site/src/components/external-link/external-link';
import { ExternalLinkArrowIcon } from '@site/src/components/Icons/external-link-arrow-icon';

// Dev doc paths land here in two flavors:
//   - legacy /docs/dev/* (and zh-CN counterpart) when no 1:1 redirect target
//     was emitted by createRedirects;
//   - new /docs-next/dev/* when DocRoot can't resolve the slug and falls back
//     to NotFoundContent (bypassing the outer @theme/NotFound).
// Both should land on a guidance card pointing at the new Dev docs entry.
const DEV_GUIDANCE = {
    en: {
        title: 'This Dev doc has moved',
        description:
            'The page you requested is not available at this URL. The Dev docs now live under /docs-next/dev/.',
        linkLabel: 'Go to new Dev docs',
        linkTo: '/docs-next/dev/getting-started/what-is-apache-doris',
    },
    'zh-CN': {
        title: 'Dev 文档已迁移',
        description: '此 URL 对应的页面不再可用。新版 Dev 文档位于 /docs-next/dev/ 下。',
        linkLabel: '前往新版 Dev 文档',
        linkTo: '/zh-CN/docs-next/dev/getting-started/what-is-apache-doris',
    },
};

function detectDevDocLocale(pathname) {
    if (!pathname) return null;
    if (/^\/zh-CN\/docs(-next)?\/dev(\/|$)/.test(pathname)) return 'zh-CN';
    if (/^\/docs(-next)?\/dev(\/|$)/.test(pathname)) return 'en';
    return null;
}

function DevDocGuidance({ locale }) {
    const copy = DEV_GUIDANCE[locale];
    return (
        <>
            <h1 className="text-[1.75rem] text-[#1D1D1D] leading-[1.6] text-center">
                {copy.title}
            </h1>
            <p className="text-center mt-2 text-sm text-[#8592A6]">{copy.description}</p>
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
        </>
    );
}

function GenericNotFound() {
    return (
        <>
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
        </>
    );
}

export default function NotFoundContent({ className }) {
    const [devLocale, setDevLocale] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDevLocale(detectDevDocLocale(window.location.pathname));
        }
    }, []);

    return (
        <main className={`container margin-vert--xl ${className || ''}`}>
            <div className="row">
                <div className="col">
                    <div className="flex justify-center mb-10">
                        <img
                            style={{ width: 120 }}
                            src={require('@site/static/images/empty-data.png').default}
                            alt=""
                        />
                    </div>
                    {devLocale ? <DevDocGuidance locale={devLocale} /> : <GenericNotFound />}
                </div>
            </div>
        </main>
    );
}
