const transformPathWithoutZhCN = (pathname: string): string => {
    if (pathname.includes('/ecosystem') || pathname.includes('/gettingStarted') ||
        pathname.includes('/benchmark') || pathname.includes('/faq') || pathname.includes('/releasenotes')) {
        return `${pathname.replace(/^\/docs\/(?:2\.1|2\.0|1\.2|dev)/, '').replace('/docs','').replace(/\/$/, '')}.md`;
    } else {
        const pathWithoutDocs = pathname.replace('/docs', '');
        if (pathname.includes('/3.0')) {
            return `/versioned_docs/version-2.1${pathWithoutDocs.replace('/3.0', '')}.md`;
        } else if (pathname.includes('/2.0')) {
            return `/versioned_docs/version-2.0${pathWithoutDocs.replace('/2.0', '')}.md`;
        } else if (pathname.includes('/1.2')) {
            return `/versioned_docs/version-1.2${pathWithoutDocs.replace('/1.2', '')}.md`;
        } else if (pathname.includes('/dev')) {
            return `/docs${pathWithoutDocs.replace('/dev', '')}.md`;
        } else {
            return `/versioned_docs/version-2.1${pathWithoutDocs}.md`;
        }
    }
};
const transformPathWithZhCN = (pathname: string): string => {
    const regex = /^\/zh-CN\/docs\/(?:2\.1|2\.0|1\.2|dev|)/
    if (pathname.includes('/gettingStarted')) {
        return `/common_docs_zh/gettingStarted/${pathname.replace(/^\/zh-CN\/docs(?:\/(?:2\.1|2\.0|1\.2|dev))?\/gettingStarted\//,'')}.md`;
    } else if (pathname.includes('/ecosystem')) {
        return `/common_docs_zh/ecosystem/${pathname.replace(/^\/zh-CN\/docs(?:\/(?:2\.1|2\.0|1\.2|dev))?\/ecosystem\//,'')}.md`;
    } else if (pathname.includes('/benchmark')) {
        return `/common_docs_zh/benchmark/${pathname.replace(/^\/zh-CN\/docs(?:\/(?:2\.1|2\.0|1\.2|dev))?\/benchmark\//,'')}.md`;
    } else if (pathname.includes('/faq')) {
        return `/common_docs_zh/faq/${pathname.replace(/^\/zh-CN\/docs(?:\/(?:2\.1|2\.0|1\.2|dev))?\/faq\//,'')}.md`;
    } else if (pathname.includes('/releasenotes')) {
        return `/common_docs_zh/releasenotes/${pathname.replace(/^\/zh-CN\/docs(?:\/(?:2\.1|2\.0|1\.2|dev))?\/releasenotes\//,'')}.md`;
    } else if (pathname.includes('/docs')) {
        if (pathname.includes('/3.0')) {
            return `/i18n/zh-CN/docusaurus-plugin-content-docs/version-3.0${pathname.replace('/zh-CN/docs/3.0', '')}.md`;
        } else if (pathname.includes('/2.0')) {
            return `/i18n/zh-CN/docusaurus-plugin-content-docs/version-2.0${pathname.replace('/zh-CN/docs/2.0', '')}.md`;
        } else if (pathname.includes('/1.2')) {
            return `/i18n/zh-CN/docusaurus-plugin-content-docs/version-1.2${pathname.replace('/zh-CN/docs/1.2', '')}.md`;
        } else if (pathname.includes('/dev')) {
            return `/i18n/zh-CN/docusaurus-plugin-content-docs/current${pathname.replace('/zh-CN/docs/dev', '')}.md`;
        } else {
            return `/i18n/zh-CN/docusaurus-plugin-content-docs/version-2.1${pathname.replace('/zh-CN/docs', '')}.md`;;
        }
    } else {
        return pathname;
    }
}
const transformPath = (pathname: string): string => {
    if (pathname.startsWith('/zh-CN')) {
        return transformPathWithZhCN(pathname)
    } else {
        return transformPathWithoutZhCN(pathname);
    }
};

export const generateUrl = (pathname: string): string => {
    const transformedPath = transformPath(pathname);
    return `https://github.com/apache/doris-website/tree/master${transformedPath}`;
};
