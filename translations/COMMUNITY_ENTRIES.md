# Community page and entry maintenance

The Events (P12), Roadmap (P13) and Community Report (P14) pages are manually
maintained landing pages. They are outside the scheduled documentation generator.
Page readiness describes the translated interface and its declared samples;
it does not imply that every historical report has a translated body.

Events use the original dataset language plus the destination URL as their entry
identity (`data-event-id`). English event descriptions are translated in the four
target dictionaries. The explicitly selected Chinese dataset retains its original
Chinese descriptions. Event posters and linked recordings retain their original
language; the page states this boundary. Keep destination URLs, displayed time
zones, dates and company names consistent with the source event. Roadmap links
retain their destination URL, and release-plan entries retain their version ID.
Neither translating a release-plan card nor a course entry translates the linked
release notes or documentation.

Weekly reports use the source filename date as their stable ID. The source is the
structured export in `src/pages/community-report/_reports/`, not a standalone
route. `translations/community-reports.json` declares complete report translations
per language. The October 2026 batch adds only the latest report, `2026-10-12`,
in Japanese, Korean and Russian. The 16 previously published Chinese reports
remain available. Other historical reports retain complete English bodies.

To publish a new report translation:

1. Translate the whole report through the stable IDs from `reportMessages()`,
   including its visible reference titles. Preserve reference numbers, URLs,
   statistics, inline code, identifiers and the original title tooltips.
2. Add its date ID to the language's `translatedReports` list only after every
   field is complete. Admission rejects unknown/duplicate IDs and missing fields.
3. Review P14's source and target dependencies and record the new publication
   digests and actual review identity in `translations/pages/state.json`.
4. Build the affected language and check report selection, hash/back navigation,
   fallback labels, body language, layout, links and the published content.

An unregistered report is selected atomically as English, even if some of its
message IDs happen to exist in a target dictionary. Its date and full prose stay
English; the surrounding controls and fallback notice use the selected site
language. Keep historical coverage separate from the page ledger. The current
scope defers historical report translation until the user schedules it again.
