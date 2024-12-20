const transformPathWithoutZhCN = (pathname: string): string => {
    if(pathname.startsWith('/docs')){
        const pathWithoutDocs = pathname.replace('/docs', '');
        if (pathname.includes('/3.0')) {
            return `/versioned_docs/version-3.0${pathWithoutDocs.replace('/3.0', '')}.md`;
        } else if (pathname.includes('/2.0')) {
            return `/versioned_docs/version-2.0${pathWithoutDocs.replace('/2.0', '')}.md`;
        } else if (pathname.includes('/1.2')) {
            return `/versioned_docs/version-1.2${pathWithoutDocs.replace('/1.2', '')}.md`;
        } else if (pathname.includes('/dev')) {
            return `/docs${pathWithoutDocs.replace('/dev', '')}.md`;
        } else {
            return `/versioned_docs/version-2.1${pathWithoutDocs}.md`;
        }
    }else{
         // community
         return `${pathname}.md`
    }
};
const transformPathWithZhCN = (pathname: string): string => {
    if (pathname.startsWith('/zh-CN/docs')) {
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
        // community
        return `/i18n/zh-CN/docusaurus-plugin-content-docs-community/current${pathname.replace('/zh-CN/community','')}.md`
    }
}
const transformDocPath = (pathname: string): string => {
    if (pathname.startsWith('/zh-CN')) {
        return transformPathWithZhCN(pathname)
    } else {
        return transformPathWithoutZhCN(pathname);
    }
};

export const generateUrl = (pathname: string): string => {
    const transformedPath = transformDocPath(pathname);
    return `https://github.com/apache/doris-website/tree/master${transformedPath}`;
};
