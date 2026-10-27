# Automatic language entry

The root homepage chooses among the languages enabled in the build. Explicit language URLs and English deep links remain authoritative. Ordinary client-side navigation keeps the current selected URL language; it does not repeat browser or region detection on every route change.

## Selection order

1. The current language-menu action or an explicit language URL wins. Opening `/ru/...` keeps Russian even when an older English preference exists.
2. At the neutral root, a valid saved manual choice wins, including English. It expires after 180 days; malformed, future-dated and disabled-language choices are ignored.
3. Otherwise, read `navigator.languages` in preference order, falling back to `navigator.language` when needed. Match an enabled exact language or its language family. For example, `en-GB` selects English, `ru-RU` selects Russian, and `zh-Hant-TW` selects the site's available Chinese locale, `zh-CN`.
4. When no browser language matches, use the approved country/region table through an exact browser IANA time-zone hint.
5. If nothing matches, detection fails, or the selected language is disabled, use English.

| Country/region policy | Default language when browser languages do not match |
| --- | --- |
| Russia, Belarus, Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan, Uzbekistan | Russian |
| Mainland China | Chinese (`zh-CN`) |
| Japan | Japanese |
| North Korea, South Korea | Korean |
| All other countries/regions | English |

The table does not override browser preference. For example, an English-first browser in Russia gets English, and a Chinese-first browser in Hong Kong gets Chinese. The regional fallback for an unmatched browser in Hong Kong remains English.

Region detection uses the device's configured time zone, not IP geolocation or the Geolocation API. It is a regional hint and cannot establish the user's actual location or native language. No external country lookup or permission prompt is added. The exact 44 zone names and nine supported aliases live in `config/locale-entry.json`, with an IANA tzdb version and source hashes. The policy uses the [IANA country/zone table](https://data.iana.org/time-zones/tzdb/zone.tab) and [backward aliases](https://data.iana.org/time-zones/tzdb/backward); equal UTC offsets and broad `Asia/*`/`Europe/*` patterns are not language rules.

## Manual choices and reset

The language menu saves a manual choice through the existing preference API. An English-root menu link carries `lang=en`, so the current explicit English action still wins when storage is blocked. Root `lang` accepts exactly one enabled locale; it is removed after processing while other query parameters and the hash remain. It cannot supply an arbitrary redirect URL. A `lang` parameter on a deep page does not override that page's URL language.

The menu's localized **Reset saved language** action removes the manual preference and the short-lived session attempt guard. The current page stays where it is. On a later neutral-root visit, browser preference and then the regional table apply again. The menu reports whether the saved preference could be cleared.

Reading or rendering the menu never chooses a different page during SSR. The first server and client renders agree; the root bootstrap runs before hydration. Detection never hides server-rendered English. With JavaScript disabled, English and the ordinary language links remain readable and usable.

## Build, publication and rollback

`scripts/i18n/locale-entry.cjs` validates the policy and receives enabled locales and the root base URL from the build. A configured but disabled locale is never an automatic destination. Do not replace the enabled list with a fixed five-language constant.

Ordinary builds embed the small bootstrap in the head. Optimized publishing uses the existing `BootstrapAssetsPlugin` and a content-addressed asset under `assets/js/bootstrap-v2/`. These opaque assets are emitted after minimization, so their final bytes match the filename hash; the new directory avoids reusing older URLs that could have been rewritten by a minimizer. Every locale compiler must emit the same root-entry configuration and filename. An internal URL marker is removed on landing; if a host mistakenly redirects a locale root back to the neutral root, the marker prevents a loop even when storage is blocked. A short session guard also suppresses immediate repeated automatic attempts. Explicit manual choices remain higher priority.

To disable automatic browser/region detection, rebuild with:

```bash
DORIS_LOCALE_AUTO_DETECT=false yarn build:publish
```

This leaves manual choice, explicit URL handling, saved preferences, reset and language routes available. Alternatively, set `enabled: false` in the reviewed policy and rebuild. Re-enable through the same deployment process. Changing the flag changes the generated bootstrap hash; do not overwrite the bytes at an old hashed URL.

Restart a dev server after changing this build-time policy. A single-locale dev server is suitable for menu/layout review with automatic detection disabled; it does not serve the other languages' destinations. Use the small real five-language fixture for redirect behavior.

```bash
node scripts/i18n/check-configuration.cjs --all
node --test scripts/i18n/__tests__/locale-entry.test.cjs
node scripts/i18n/verify-content-fixture.cjs
node scripts/i18n/verify-locale-entry-fixture.cjs
node scripts/publish/verify-fixture.cjs --browser
```

Browser checks require the CI-installed Playwright/Chromium tools, or an equivalent local `NODE_PATH`. These fixtures validate the candidate implementation and hashed publication path; they do not establish public deployment. After merge, bind public acceptance to the source SHA and immutable asf-site artifact, then verify root selection, explicit URLs, reset, no-JavaScript behavior, the disabled-detection path and resource loading.
