// Expensive integration suites follow their implementation owners. Shared UI
// changes are covered by the real multilingual sample, not every suite.
function fixtures(files, full = false) {
    const matches = expression => full || files.some(file => expression.test(file));
    return {
        runContentFixture: matches(/^(scripts\/i18n\/(docs-plugin|status-plugin|content-manifest|manual-state|manual-plugins|native-context|route-context|page-body|page-body-loader|verify-static|verify-content-fixture|verify-global-language)\.cjs$|scripts\/i18n\/__tests__\/fixtures\/(content-manifest|multi-locale)\.cjs$|src\/components\/Content(Route|Metadata)\.tsx$|src\/utils\/(localizedRoute|contentRoute|useLocalizedRoute)\.[jt]sx?$|src\/theme\/(DocItem|SiteMetadata)\/|config\/i18n\.js$|docusaurus\.config\.js$|package\.json$|yarn\.lock$|translations\/(pages|shared)\/registry\.json$)/),
        runDocDatesFixture: matches(/^scripts\/(last-update\/|i18n\/verify-doc-dates-fixture\.cjs$)/),
        runBlogFixture: matches(/^scripts\/i18n\/(verify-blog-fixture\.cjs$|__tests__\/fixtures\/blog\.cjs$)/),
        runBlogAutomationFixture: matches(/^scripts\/i18n\/(automated-blog(?:-body-loader)?|blog-automation(?:-cli)?|create-blog-baseline|verify-blog-automation-fixture)\.cjs$|^scripts\/i18n\/__tests__\/fixtures\/blog\.cjs$/),
        runSourceRevisionsFixture: matches(/^scripts\/i18n\/(source-revisions|verify-source-revisions-fixture)\.cjs$/),
        runReleasePolicyFixture: matches(/^scripts\/i18n\/(release-policy|verify-release-policy-fixture)\.cjs$|^translations\/release-notes-baseline\.json$/),
        runLocaleEntryFixture: matches(/^scripts\/i18n\/(locale-entry|verify-locale-entry-fixture)\.cjs$|^static\/js\/locale-entry-bootstrap\.js$|^config\/locale-entry\.json$/),
    };
}
module.exports = {fixtures};
