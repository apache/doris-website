# Archived documentation sources

Apache Doris documentation versions **2.1, 2.0, and 1.2 are archived and no longer
maintained**. These snapshots retain the original content and relative directory
structure:

```text
archived_docs/
├── versioned_docs/version-{2.1,2.0,1.2}/
├── i18n/zh-CN/docusaurus-plugin-content-docs/
│   ├── version-{2.1,2.0,1.2}/
│   └── version-{2.1,2.0,1.2}.json
└── versioned_sidebars/version-{2.1,2.0,1.2}-sidebars.json
```

Do not edit these snapshots as part of routine documentation updates or recreate
their former directories in the active documentation trees. Maintain Dev, 4.x,
and 3.x instead, following the active version list in `../versions.json`.

The website does not build these snapshots as documentation pages. Published
PDFs are available at [/archived-docs](https://doris.apache.org/archived-docs/).
The redirect generator reads these sources to preserve historical URLs, and
the local PDF exporter can still read their content and sidebars:

```sh
./scripts/docs-pdf/generate.sh 2.1 zh-CN
```

Run commands from the repository root. See
[the PDF export guide](../scripts/docs-pdf/README.md) for requirements and options.
