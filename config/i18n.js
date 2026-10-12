// Keep CI locale discovery independent of Docusaurus and installed dependencies.
const locales = ['en', 'zh-CN', 'ja'];
const enabledLocales = () => locales.filter(locale => locale !== 'ja' || process.env.DORIS_ENABLE_JA === 'true');
module.exports = {locales, enabledLocales};
