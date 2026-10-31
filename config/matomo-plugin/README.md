# Website analytics

The local adapter retains `docusaurus-plugin-matomo`'s tracker configuration,
initial HTML page view, link tracking and heartbeat. Its route hook skips initial
hydration, counts subsequent pathname/query changes once, preserves query
parameters and ignores document-anchor changes. Titles are read after route
commit, following Docusaurus's deferred Helmet update.

The tracker loads only on the exact production origin in `siteConfig.url`.
Development builds, local production previews, staging/CDN HTML and browsers
that expose `navigator.webdriver` do not load it or queue route page views.
This prevents known browser automation from entering production statistics;
automation that hides WebDriver or sends tracking requests directly still
requires investigation and filtering at the analytics/server level.

Run the unit tests and browser fixture with:

```bash
node --test scripts/publish/__tests__/matomo.test.cjs
node scripts/publish/verify-matomo-fixture.cjs
```

The fixture requires Playwright and builds a small English/Chinese site. It
fulfills all browser requests locally, including a tracker double, so validating
the production-origin rules does not send analytics to Apache. It covers direct
home/document loads, SPA navigation, history, language changes and disabled
tracking in previews and automation. CI runs it with the publishing fixtures.

Record the deployment date when interpreting PV and bounce-rate changes. The
previous double-counted initial PVs cannot be corrected with one global divisor.
