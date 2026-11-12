import {translate} from '@docusaurus/Translate';

export function blogContentLocale(metadata: any, siteLocale: string): string {
    return metadata.dorisContent?.contentLocale
        ?? (metadata.source?.startsWith(`@site/i18n/${siteLocale}/`) ? siteLocale : 'en');
}
// IDs and query parameters keep their English identity. Only display labels
// are translated, including tags used in native tag routes.
export function blogCategoryLabel(id: string): string {
    switch (id) {
        case 'All': return translate({id: 'blog.category.all', message: 'All'});
        case 'Tech Sharing': return translate({id: 'blog.category.tech', message: 'Tech Sharing'});
        case 'Best Practice': return translate({id: 'blog.category.practice', message: 'Best Practice'});
        case 'Release Notes': return translate({id: 'blog.category.releases', message: 'Release Notes'});
        case 'Top News': return translate({id: 'blog.category.news', message: 'Top News'});
        case 'Glossary': return translate({id: 'blog.category.glossary', message: 'Glossary'});
        default: return id;
    }
}
