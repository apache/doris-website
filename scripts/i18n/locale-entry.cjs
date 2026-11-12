// Build-time policy only. The browser receives a small enabled-locale allowlist,
// never a route manifest or a network-based country lookup.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function entryOptions(context) {
    const {currentLocale, defaultLocale, locales} = context.i18n;
    let baseUrl = context.baseUrl ?? context.siteConfig.baseUrl;
    if (currentLocale !== defaultLocale && baseUrl.endsWith(`/${currentLocale}/`))
        baseUrl = baseUrl.slice(0, -(currentLocale.length + 1));
    return {baseUrl, defaultLocale, locales};
}

function settings(root, options = {}) {
    const file = path.join(root, 'config/locale-entry.json');
    if (!fs.existsSync(file)) return null;
    const policy = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert(policy.schemaVersion === 1 && typeof policy.enabled === 'boolean'
        && policy.regionSource === 'browser-time-zone', 'Invalid locale entry policy');
    const registry = require(path.join(root, 'config/i18n.js'));
    const locales = options.locales ?? registry.enabledLocales();
    const registered = registry.localeRegistry.map(locale => locale.code);
    const defaultLocale = options.defaultLocale ?? 'en';
    const baseUrl = options.baseUrl ?? '/';
    assert(defaultLocale === 'en' && Array.isArray(locales) && locales.includes(defaultLocale)
        && new Set(locales).size === locales.length && locales.every(locale => registered.includes(locale)), 'Invalid enabled entry locales');
    assert(typeof baseUrl === 'string' && /^\/(?!\/)/.test(baseUrl) && baseUrl.endsWith('/')
        && !/[?#\\]/.test(baseUrl) && !baseUrl.split('/').includes('..'), 'Invalid locale entry base URL');
    assert(policy.preference?.key === 'doris.localePreference' && policy.preference.maxAgeDays === 180
        && typeof policy.sessionKey === 'string' && policy.sessionKey.startsWith('doris.')
        && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(policy.loopParameter), 'Invalid locale preference contract');
    const timeZones = {};
    assert(policy.countries && typeof policy.countries === 'object' && !Array.isArray(policy.countries), 'Missing entry country table');
    for (const [country, region] of Object.entries(policy.countries)) {
        assert(/^[A-Z]{2}$/.test(country) && registered.includes(region.locale)
            && Array.isArray(region.timeZones) && region.timeZones.length, `Invalid entry region: ${country}`);
        for (const zone of region.timeZones) {
            assert(/^[A-Za-z_-]+\/[A-Za-z_/-]+$/.test(zone) && !Object.hasOwn(timeZones, zone), `Invalid/duplicate entry time zone: ${zone}`);
            timeZones[zone] = region.locale;
        }
    }
    for (const [alias, target] of Object.entries(policy.aliases ?? {})) {
        assert(/^[A-Za-z_/-]+$/.test(alias) && !Object.hasOwn(timeZones, alias)
            && Object.hasOwn(timeZones, target), `Invalid entry time-zone alias: ${alias}`);
        timeZones[alias] = timeZones[target];
    }
    return {enabled: policy.enabled && process.env.DORIS_LOCALE_AUTO_DETECT !== 'false', baseUrl, defaultLocale, locales,
        timeZones, preferenceKey: policy.preference.key, preferenceMaxAge: policy.preference.maxAgeDays * 86400000,
        sessionKey: policy.sessionKey, loopParameter: policy.loopParameter};
}

function bootstrap(root, options) {
    const config = settings(root, options);
    if (!config) return null;
    const source = fs.readFileSync(path.join(root, 'static/js/locale-entry-bootstrap.js'), 'utf8').trim();
    // It is also embedded inline for ordinary builds; do not allow script tags
    // or Unicode line separators from configuration to terminate that context.
    const encoded = JSON.stringify(config).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    return `${source}(${encoded});\n`;
}

module.exports = {entryOptions, settings, bootstrap};
