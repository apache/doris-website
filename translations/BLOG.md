# Manual blog translations

Blog posts keep the English relative source path as their identity. Translations
live at `i18n/<locale>/docusaurus-plugin-content-blog/<same-relative-path>`.
Native Docusaurus parsing owns dates, permalinks, authors, tags, drafts, unlisted
posts and routing. Never derive a translated slug from the translated title.

Each article/locale has its own record at
`translations/blog/pages/<locale>/<English-relative-path>.json`, for example
`pages/ja/apache-doris-vs-rockset.md.json`. The record uses
`{"schemaVersion": 1, "page": {...}}` and stores source/target dependencies,
their digests, publication state and actual review status. There is no shared
article index to update. Different article and language PRs can merge without
editing one central state file; duplicate or misplaced identities fail admission.
Missing or blocked
posts use the complete English article at the selected locale URL. A changed
manual source reports `needs-update` and retains the published translation;
edited target bytes require a new explicit publication decision. Machine review
does not imply native-speaker proofreading.

## Partial coverage

Each post has its own language, canonical, robots and alternate decision. Adding
one translation does not make any other English fallback post indexable.
Native list, tag, archive and author routes have separate aggregate identities:
a localized aggregate is indexable only when its actual membership contains an
indexable translation. Aggregates retain the full native article set, show
English-content labels per untranslated article and are excluded from prose
translation denominators. Draft and unlisted rules still apply.

English and localized source paths both enter native Markdown link resolution,
so an English fallback article can link to a translated peer. Stable tag URLs,
category query values, dates, author IDs and headline order are preserved.
Categories are translated for display only. Cards open the locale's article;
external originals remain available through the article's explicit original
link. External teaser translations cover the repository's teaser, not the full
third-party article. External originals retain their actual language label.

Feeds include only listed, indexable articles with actual prose in the feed's
language. Filtering happens before the native feed limit. A locale with no
translations generates and advertises no feed.

## Maintenance and validation

1. Read the native inventory and refresh the selected English source files:
   `node scripts/i18n/blog-inventory.cjs --output /tmp/blog-inventory.json`.
   This reads metadata without compiling the site or calling a model.
2. Translate prose, title, description, summary and image descriptions; preserve
   technical data, URLs, author/date/tag identity and executable MDX. Localized
   imports may use equivalent `@site/src/...` paths when the source uses
   `../src/...`. Declare imported components and media as source dependencies.
3. Review the complete target and update its explicit state with `digestFiles`
   from `manual-state.cjs`. Do not refresh a digest to conceal an unreviewed edit.
4. Run `node scripts/i18n/check-blog-translations.cjs` and the manual report.
   PR admission checks both. The blog checker verifies the existing protected
   content contract, including numbers, links, code and metadata identity.
5. Use `node scripts/i18n/verify-blog-fixture.cjs` for a small five-language
   0/1/partial/full-coverage site. `--pilot` builds only the four actual pilot
   articles, an untranslated headline and ten small pagination controls, with
   the real blog UI. Neither is a
   full-site build or public deployment proof.

Source changes remain manual maintenance work. Blog translation never enters
the scheduled documentation generator. After merge, record deployment identity
and actual public URLs before counting an article as publicly complete.
