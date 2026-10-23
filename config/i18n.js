// Keep CI locale discovery independent of Docusaurus and installed dependencies.
// Every locale is declared once here, and the site configuration, the build
// scope, the render path and the browser UI read this registry instead of
// naming one language in code.
//
// `optional` locales are still being introduced, so they stay opt-in behind
// DORIS_ENABLE_<LANG> and must never reach a default build or a deployment by
// accident. `ordinaryPages` records whether the locale's non-docs pages are
// translated; `translatedPages` lists exceptions for a docs-first locale.
// Links to the remaining pages target the default locale instead of a
// locale-prefixed page that would only repeat English.
const fs = require('node:fs');
const path = require('node:path');

const localeRegistry = [
    {code: 'en', label: 'English', htmlLang: 'en-US', optional: false, ordinaryPages: true},
    {code: 'zh-CN', label: '中文', htmlLang: 'zh-Hans-CN', optional: false, ordinaryPages: true},
    {code: 'ja', label: '日本語', htmlLang: 'ja', optional: true, ordinaryPages: false,
        translatedPages: [
            '/why-doris/compare',
            '/why-doris/benchmarks',
            '/why-doris/key-features',
            '/use-cases/customer-facing-analytics',
            '/use-cases/data-warehousing',
            '/use-cases/observability',
            '/use-cases/ai',
        ]},
    {code: 'ko', label: '한국어', htmlLang: 'ko', optional: true, ordinaryPages: false,
        translatedPages: [
            '/why-doris/compare',
            '/why-doris/benchmarks',
            '/why-doris/key-features',
            '/use-cases/customer-facing-analytics',
            '/use-cases/data-warehousing',
            '/use-cases/observability',
            '/use-cases/ai',
        ]},
    {code: 'ru', label: 'Русский', htmlLang: 'ru', optional: true, ordinaryPages: false,
        translatedPages: [
            '/why-doris/compare',
            '/why-doris/benchmarks',
            '/why-doris/key-features',
            '/use-cases/customer-facing-analytics',
            '/use-cases/data-warehousing',
            '/use-cases/observability',
            '/use-cases/ai',
        ]},
];
const locales = localeRegistry.map(locale => locale.code);
// ja reads DORIS_ENABLE_JA, ko reads DORIS_ENABLE_KO. CI enables
// exactly the locales one change can reach through DORIS_ENABLE_LOCALES, so it
// never has to name a language in the workflow.
const flagFor = locale => `DORIS_ENABLE_${locale.code.split('-')[0].toUpperCase()}`;
const selectedLocales = () => (process.env.DORIS_ENABLE_LOCALES ?? '').split(',').map(locale => locale.trim()).filter(Boolean);
const isEnabled = locale => !locale.optional
    || selectedLocales().includes(locale.code) || process.env[flagFor(locale)] === 'true';
const enabledLocaleRecords = () => localeRegistry.filter(isEnabled);
const enabledLocales = () => enabledLocaleRecords().map(locale => locale.code);

// Blog posts are the one content type without per-document translation state:
// the blog plugin falls back per file, and a locale that holds no translated
// post serves the default locale's articles at its own blog URLs. Those routes
// are a second copy of every article, so the render path keeps them out of the
// index, and this decides which locale that applies to. A locale leaves the
// list as soon as its blog directory holds a translated post file.
const blogTranslationDir = (root, locale) => path.join(root, 'i18n', locale, 'docusaurus-plugin-content-blog');
function hasBlogTranslations(root, locale) {
    try {
        return fs.readdirSync(blogTranslationDir(root, locale), {recursive: true, withFileTypes: true})
            .some(entry => entry.isFile() && /\.mdx?$/i.test(entry.name));
    } catch {
        return false;
    }
}

module.exports = {locales, localeRegistry, enabledLocaleRecords, enabledLocales, hasBlogTranslations};
