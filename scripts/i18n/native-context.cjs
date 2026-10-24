const path = require('node:path');
const {normalizeUrl} = require('@docusaurus/utils');
function localizedContext(context, locale) {
    const defaultLocale = context.i18n.defaultLocale;
    const rootBaseUrl = context.i18n.currentLocale === defaultLocale ? context.baseUrl
        : context.baseUrl.replace(`/${context.i18n.currentLocale}/`, '/');
    const baseUrl = locale === context.i18n.currentLocale ? context.baseUrl
        : normalizeUrl([rootBaseUrl, locale === defaultLocale ? '' : locale, '/']);
    return {...context, baseUrl, siteConfig: {...context.siteConfig, baseUrl}, localizationDir: path.join(context.siteDir, 'i18n', locale),
        i18n: {...context.i18n, currentLocale: locale}};
}
module.exports = {localizedContext};
