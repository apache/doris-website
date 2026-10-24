# Shared interface and homepage translations

`translations/shared/registry.json` declares the shared entry components, their
English messages, source dependencies and the last reviewed source digest.
`node scripts/i18n/manual-report.cjs` checks all four target dictionaries and
reports source drift. It does not call a model or edit a dictionary.

The shared entries cover the desktop/mobile NavbarNext, AI loading/error labels,
color-theme controls, community/feedback prompt, footer operations, 404 actions,
and documentation search labels, results, empty states and context selector.
Language-menu and English-fallback notices use the existing five-language
`src/utils/languageMessages.ts` table, included in the shared source digest.
Docusaurus supplies its native UI translations; the dictionaries keep the
repository's existing document status and sidebar labels.

Footer resources and community actions follow the site language, including on
English-body fallback pages. The ASF name, logo alternative text, copyright,
license and trademark statement remain their official English source; the legal
container explicitly declares `lang="en"`. Product names, service names, version
identifiers, SQL field/function names, query example document titles and ISO dates
in the sample search corpus remain unchanged. Color palette names identify the
existing branded themes and keep their original names.

The Kapa bootstrap localizes its existing modal title/disclaimer attributes and
states that answer language depends on the external service and question. Consent
and third-party legal text retain the original English. The release checks block
external services during local testing; an unavailable mock AI service is not
proof of a production outage. Download/profile forms are page-body interfaces:
while their pages are missing, they intentionally render the complete English
body and are covered by their later content batches.

The homepage has three explicit target `ready` records (`page:P01`: ja/ko/ru).
Chinese landing bodies intentionally use English, including the homepage, while
Chinese documentation and shared navigation retain their existing localization.
`translations/pages/registry.json` declares `englishFallbackLocales: ["zh-CN"]`;
manual admission and the native page adapter reject ready Chinese landing bodies.
The Chinese routes remain available with an English body, localized fallback
notice, English canonical and noindex. This is a deliberate scope choice, not
translation debt or a missing route. Coverage keeps the actual denominator and
records `intentional_english_fallback` exceptions.

The homepage's 233 dictionary messages in each translated body include metadata, sections, news, interactions, accessibility labels and
six deployment-diagram labels. Its source dependencies include all three live
`static/home-next/*.html` frames, `embedded-locale.js` and the existing theme
bridge. The diagrams request their body locale in the URL. The two deployment
JPEGs remain historical assets; the homepage now uses a theme-aware SVG component
with localizable text. `static/animations/what-is-apache-doris-intro.html` is not
referenced by HomeNext and is outside this batch. Mobile retains the existing
layout that hides decorative iframe illustrations.

Existing Japanese homepage messages are reused. New Korean/Russian content is machine reviewed,
not certified as a human/native-language review. Existing product translations
retain their review identity. Since their state hashes cover the complete
`code.json`, shared dictionary additions require updating those target hashes:
first compare every product message against the baseline and validate its full
message set; do not acknowledge unrelated product edits by merely rehashing.

Run the manual report before a build and `manual-report.cjs --coverage` after one.
Coverage groups use native source identities and retain source-deletion,
orphan-target, utility and native-route exceptions. Real translations and English
fallbacks are separate from route availability. `needsUpdate` overlaps real
translations; it does not turn an existing stale translation into a missing body.
`partialCompilation` describes CI compilation coverage and never proves public
availability. A missing new English page may publish as a fallback; a declared
ready page with missing messages, invalid placeholders or a changed target digest
fails admission/build validation.
