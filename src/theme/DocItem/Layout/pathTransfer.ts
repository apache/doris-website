const transformPathWithoutZhCN = (pathname: string): string => {
    if (pathname.includes('/what-is-apache-doris')) {
        return '/gettingStarted/what-is-apache-doris.md';
    } else if (pathname.includes('/ecosystems') ||
        pathname.includes('/benchmark') || pathname.includes('/faq') || pathname.includes('/releasenotes')) {
        return `${pathname}.md`;
    } else if (pathname.includes('/docs')) {
        const pathWithoutDocs = pathname.replace('/docs', '');
        if (pathname.includes('/2.1')) {
            return `/versioned_docs/version-2.1${pathWithoutDocs}.md`;
        } else if (pathname.includes('/2.0')) {
            return `/versioned_docs/version-2.0${pathWithoutDocs}.md`;
        } else if (pathname.includes('/1.2')) {
            return `/versioned_docs/version-1.2${pathWithoutDocs}.md`;
        } else if (pathname.includes('/dev')) {
            return `/docs${pathWithoutDocs.replace('/dev', '')}.md`;
        } else {
            return `/versioned_docs/version-3.0${pathWithoutDocs}.md`;
        }
    } else {
        return pathname;
    }
};
const transformPathWithZhCN = (pathname: string): string => {
    if (pathname.includes('/what-is-apache-doris')) {
        return '/i18n/zh-CN/docusaurus-plugin-content-docs-gettingStarted/current/what-is-apache-doris.md';
    } else if (pathname.includes('/ecosystems')) {
        return `/i18n/zh-CN/docusaurus-plugin-content-docs-ecosystem/current${pathname.replace('/zh-CN/ecosystems', '')}.md`;
    } else if (pathname.includes('/benchmark')) {
        return `/i18n/zh-CN/docusaurus-plugin-content-docs-benchmark/current${pathname.replace('/zh-CN/benchmark', '')}.md`;
    } else if (pathname.includes('/faq')) {
        return `/i18n/zh-CN/docusaurus-plugin-content-docs-faq/current${pathname.replace('/zh-CN/faq', '')}.md`;
    } else if (pathname.includes('/releasenotes')) {
        return `/i18n/zh-CN/docusaurus-plugin-content-docs-releases/current${pathname.replace('/zh-CN/releasenotes', '')}.md`;
    } else if (pathname.includes('/docs')) {
        if (pathname.includes('/2.1')) {
            return `/i18n/zh-CN/docusaurus-plugin-content-docs/version-2.1${pathname.replace('/zh-CN/docs/2.1', '')}.md`;
        } else if (pathname.includes('/2.0')) {
            return `/i18n/zh-CN/docusaurus-plugin-content-docs/version-2.0${pathname.replace('/zh-CN/docs/2.0', '')}.md`;
        } else if (pathname.includes('/1.2')) {
            return `/i18n/zh-CN/docusaurus-plugin-content-docs/version-1.2${pathname.replace('/zh-CN/docs/1.2', '')}.md`;
        } else if (pathname.includes('/dev')) {
            return `/i18n/zh-CN/docusaurus-plugin-content-docs/current${pathname.replace('/zh-CN/docs/dev', '')}.md`;
        } else {
            return `/i18n/zh-CN/docusaurus-plugin-content-docs/version-3.0${pathname.replace('/zh-CN/docs', '')}.md`;;
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
