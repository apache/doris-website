import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
// Only body modules import this hook. Navigation and URL helpers retain siteLocale.
export default function useEnglishContentContext() {
    const context = useDocusaurusContext();
    return {...context, i18n: {...context.i18n, currentLocale: context.i18n.defaultLocale}};
}
