# Content manifest v1

The build contract joins native content identity, routes, translation availability,
body language and indexing decisions. It does not replace `translations/state/`
or change existing page rendering. The status plugin writes
`.i18n-build/content-manifests/<locale>.json` and `<locale>.sizes.json`.
The legacy `.i18n-build/manifests/<locale>.json` and its browser API remain intact.

## Identity and routing

| Kind | Stable identity | Route authority |
| --- | --- | --- |
| docs | `docs:` + JSON `[pluginId, version, docId]` | Native docs metadata, including localized Chinese slugs |
| page | `page:<registry-id>` | Native pages metadata |
| blog | `blog:<English-source-relative-path>` | Native blog metadata, including date/custom permalink |
| utility | `utility:<registry-id>` | Native pages metadata; always excluded from indexing |

`pages/registry.json` pins the 21 existing page IDs P01–P21 and the Slack utility.
Keep the ID when moving a source file. Update its source path and redirects in the
same change. Unregistered native pages get a source-path ID and an explicit report;
assign a registry ID before adopting them into the stable public contract. Search
and 404 belong to their native plugins; add their utility identities when those
plugins expose route metadata in T05. They are not inferred from URL strings.
Blog plugin instances other than `default` namespace their source paths with the
plugin ID. An English source move needs a deliberate migration and redirects in
T14. A localized-only file does not establish an English identity.

Each page records `sourceSha` (the checkout's Git HEAD), `siteLocale`,
`contentLocale`, `state`, `route`, `englishRoute`, `fallback`, `indexable` and an
`updatePolicy`. All pages in an output share the source SHA. Source/target hashes
bind the selected input bytes; `snapshotHash` binds the complete output decision
set. Local uncommitted work still has the checkout's HEAD: retain the patch and
its digest with validation evidence. The publishing builder also rejects tracked
source changes between locale builds.

`navigationRoutes` contains only enabled, native routes for the same identity,
including English fallback routes. `availableTranslations` contains only
indexable, non-fallback members. Draft docs are absent from this registry;
unlisted/noIndex content remains navigable but is excluded from translations.
Unknown identities and orphan targets are reported rather than assigned an
invented counterpart. Chinese-only docs remain explicit unsupported source
reports. Disabled languages are removed from routes, translation lists and
locale-specific reports.

## Rendering adoption

`renderIntegrated` is true for the docs adapter and English sources. The manual
page/blog decisions have `renderIntegrated: false` until T03/T14 connects their
renderers. Those decisions describe declared publication availability, not an
assertion that the existing renderer already applies whole-page fallback. Do not
use pending manual decisions to change live SEO. In particular, the old seven
marketing translations have not been promoted to `ready` by this task. Their
manual audit and migration remain in T10. No translated content is generated here.

## Independent update policies

The docs adapter copies the existing state decision without changing its hash,
technical-content, source override, review or ownership rules. `current`,
`stale_prose`, conflicts and other states retain their existing meaning. Chinese
manual docs keep native per-file selection. English fallback is never converted
to `current` or `ready` by a compatibility reader.

`pages/state.json` and `blog/state.json` contain `{schemaVersion: 1, pages: []}`.
Each manual record uses:

```json
{
  "contentId": "page:P01",
  "locale": "ja",
  "state": "ready",
  "sourceFiles": ["src/pages/index.tsx", "src/components/home/index.tsx"],
  "targetFiles": ["i18n/ja/code.json"],
  "messageNamespaces": ["homepage"],
  "sourceHash": "<digestFiles result at publication>",
  "targetHash": "<digestFiles result at publication>",
  "reviewStatus": "unverified"
}
```

This illustrates the shape; it is not a valid ready record until paths exist and
both hashes are computed. Use `digestFiles(root, files)` from
`scripts/i18n/manual-state.cjs`: it sorts unique relative paths, hashes each file
with the existing CRLF normalization, then hashes the ordered path/hash pairs.
Explicit dependencies must include the entry module, shared body components,
English messages/data, target messages/data and resources that affect publication.
The adapter requires the native English entry in `sourceFiles`; blog records must
also include the native localized file in `targetFiles`. Whole dictionaries are
valid dependencies but produce broader drift reports. `messageNamespaces` and
reviewer metadata may document the publication unit; neither grants automatic
ownership or human review. These records never enter the docs scheduler.

| State / event | Selected body | Index policy |
| --- | --- | --- |
| no record / missing / blocked | English | Not indexable in the target locale |
| ready, matching hashes | Published target | Indexable unless native metadata excludes it |
| source hash changed / needs-update | Published target; report pending update | Preserve indexability |
| missing dependency / changed target hash / invalid native metadata | Fail build | Require explicit repair or publication update |

A source update must not overwrite the old `sourceHash` just to clear drift.
Re-review, update the target as needed, then record both current digests and the
actual review identity. A target edit requires a new explicit publication record;
it cannot silently fall back. The initial empty ledgers deliberately make no new
claims about translated body coverage. Complete blog route, draft, tag, author,
feed, anchor and lifecycle validation remains in T14.

## Consumers and validation

`scripts/i18n/content-manifest.schema.json` describes the serialized shape.
`validateManifest()` checks identity uniqueness, source/locale consistency,
native routes, enabled-language closure and fallback/indexing invariants.
`buildManifest()` joins all native inputs before producing the current locale.
Reports cover deleted English sources, isolated targets, conflicting Chinese
identities and unregistered page IDs. They do not delete files or change URLs.

Full manifests are build artifacts. Do not import them into React or put them in
`setGlobalData`. `routeData(page)` produces one compact payload;
`ContentRouteData` and `contentRouteGroups()` in `src/utils/translation.ts` keep
navigation and indexing consumers distinct. T02/T03 will attach only the current
page or required family to its route. The current compatibility browser data is
unchanged. The size report records full bytes, maximum per-page route bytes and
zero added global payload bytes. Existing global alternate data can be retired
when T02 consumers migrate.

Run `node --test scripts/i18n/__tests__/content-manifest.test.cjs` for native
metadata and state boundaries, then `node scripts/i18n/verify-content-fixture.cjs`
for sequential five-language and disabled-Russian production builds. The fixture
uses real docs (two versions/two plugins), React pages, native blog posts and a
utility route; target coverage is zero/one/partial/full. It checks emitted HTML,
route existence, body selection, source binding and payload sizes. This fixture
does not certify full production publishing, page-wide SEO or blog lifecycle.
CI selects the complete optimized five-language, all-active-version build for
changes to the contract, adapters or manual ledgers, and archives size reports.
