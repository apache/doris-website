---
title: Documentation Contribution Guide
language: en
description: "How to contribute documentation to Apache Doris: repository structure, version management, sidebar configuration, and PR submission workflow."
keywords:
    - Apache Doris
    - documentation contribution
    - doris-website
    - sidebar configuration
    - multi-version documentation
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Documentation contribution / submitting documentation modification PRs -->

This article describes how to contribute documentation to Apache Doris, including the directory structure of the website repository, where to modify documentation for each version, how to configure the sidebar and Chinese translation files, and the writing conventions for the command help manual.

Whether you are working on historical versions or the latest version of the documentation, all changes are submitted as PRs to the [apache/doris-website](https://github.com/apache/doris-website) repository.

:::tip

For the PR submission workflow, you can also refer to:

- [Contribute to Doris](./contribute-to-doris)
- [Pull Request Guide](./pull-request)

:::

## Doris Website Repository Structure

The following is the main directory tree of the [apache/doris-website](https://github.com/apache/doris-website) repository. Before contributing documentation, use it to locate the position you need to modify.

```plain
.
├── blog
│   ├── 1.1 Release.md
│   ├── Annoucing.md
│   ├── jd.md
│   ├── meituan.md
│   ├── release-note-0.15.0.md
│   ├── release-note-1.0.0.md
│   └── xiaomi.md
├── community
│   ├── design
│   │   ├── grouping_sets_design.md
│   │   └── metadata-design.md
│   ├── ......
├── docs
│   ├── admin-manual
│   │   ├── cluster-management
│   │   ├── config
│   │   ├── data-admin
│   │   ├── http-actions
│   │   ├── maint-monitor
│   │   ├── privilege-ldap
│   │   ├── multi-tenant.md
│   │   ├── optimization.md
│   │   ├── query-profile.md
│   │   └── sql-interception.md
│   │   └── workload-group.md
│   ├── ......
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── current
│       │   ├── version-1.2
│       │   ├── version-2.0
│       │   ├── version-2.1
│       │   ├── current.json
│       │   ├── version-1.2.json
│       │   ├── version-2.0.json
│       │   ├── version-2.1.json
│       ├── docusaurus-plugin-content-docs-community
│       └── local_build_docs.sh
├── src
│   ├── components
│   │   ├── Icons
│   │   ├── More
│   │   ├── PageBanner
│   │   └── PageColumn
│   ├── ......
├── static
│   ├── images
│   │   ├── Bloom_filter.svg.png
│   │   ├── .....
│   └── js
│       └── redirect.js
├── versioned_docs
│   ├── version-1.2
│   ├── version-2.0
│   └── version-2.1
├── versioned_sidebars
│   ├── version-1.2-sidebars.json
│   ├── version-2.0-sidebars.json
│   └── version-2.1-sidebars.json
├── babel.config.js
├── build.sh
├── buildVersions.sh
├── docusaurus.config.js
├── package.json
├── README.md
├── sidebars.json
├── sidebarsCommunity.json
├── tsconfig.json
└── versions.json
```

The following table summarizes the purpose of each directory to help you quickly locate where to make changes.

| Directory | Content | Scope |
| --- | --- | --- |
| `blog/` | Blog article Markdown files | Shared across all versions |
| `community/` | English community documentation | Shared across all versions |
| `docs/` | English latest version (Dev / Master) documentation | Current main branch |
| `versioned_docs/version-X.X/` | English historical version documentation | 1.2 / 2.0 / 2.1, etc. |
| `i18n/zh-CN/docusaurus-plugin-content-docs/current/` | Chinese latest version documentation | Current main branch |
| `i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X/` | Chinese historical version documentation | 1.2 / 2.0 / 2.1, etc. |
| `i18n/zh-CN/docusaurus-plugin-content-docs-community/` | Chinese community documentation | Shared across all versions |
| `sidebars.json` | Sidebar for the latest version of the documentation | Shared between Chinese and English |
| `versioned_sidebars/version-X.X-sidebars.json` | Sidebar for historical version documentation | Shared between Chinese and English |
| `sidebarsCommunity.json` | Sidebar for community documentation | Shared across all versions |
| `static/images/` | Documentation image resources | Shared across all versions |

## Blog Directory

The blog directory is located at `/blog` under the root directory. All blog Markdown files are placed in this directory.

If you want to contribute to the blog or share your technical insights, you are welcome to contact us at `dev@doris.apache.org` or submit a blog PR directly.

## Documentation Directory

<!-- Knowledge type: Procedure -->

When modifying documentation, depending on the type of change, you need to modify different files at the same time:

1. **Modifying existing documentation content**: You need to update both the latest documentation version on the Master branch and the corresponding version branches (such as 2.1, 2.0, 1.2, or multiple versions).
2. **Adding new documentation**: In addition to uploading the new Markdown file, you also need to add the new documentation link path in the sidebar file.
3. **Adding a new documentation category**: In addition to adjusting the directory structure, you also need to add the Chinese translation for the new category.

The file types that need to be modified are as follows:

| File type | Purpose | Example |
| --- | --- | --- |
| Markdown file | Documentation body content | `docs/admin-manual/xxx.md` |
| Sidebar file | Controls the directory structure | `sidebars.json` / `version-2.1-sidebars.json` |
| Translation file | Controls how categories are displayed in the Chinese documentation | `current.json` / `version-2.1.json` |

:::caution Note

All documentation must include both Chinese and English versions. Otherwise, the directory structure becomes inconsistent and the Chinese documentation may fail to display. This rule applies to all blog, documentation, and community content.

:::

### Dev Version: Latest Master Branch Documentation

**1. Where to modify content**

- English documentation: under `docs/` at the root directory
- Chinese documentation: under `i18n/zh-CN/docusaurus-plugin-content-docs/current/`

```plain
.
├── docs
│   ├── admin-manual
│   ├── ......
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── current
│       │   │    ├── admin-manual
│       │   │    ├── ......
```

**2. Documentation directory structure**

For the Dev version, both Chinese and English documentation are controlled by `sidebars.json` in the root directory.

Example of `sidebars.json`:

```json
{
    "docs": [
            {
                "type": "category",
                "label": "Getting Started",
                "items": [
                    "get-starting/quick-start",
                    "get-starting/what-is-apache-doris"
                ]
            },
            {
                "type": "category",
                "label": "Install and Deploy",
                "items": [
                    "install/standard-deployment",
                    {
                        "type": "category",
                        "label": "Docker Deployment",
                        "items": [
                            "install/construct-docker/build-docker-image",
                            "install/construct-docker/run-docker-cluster"
                        ]
             }
             ......
         }
     ]
 }
```

**3. Chinese translation for categories**

The Chinese translation file for Dev version categories is located at `i18n/zh-CN/docusaurus-plugin-content-docs/current.json`.

Taking the category "Getting Started" as an example:

- `sidebar.docs.category.Getting Started` corresponds to the `label` hierarchy in `sidebars.json`.
- The format is: `sidebar` + `.` + `docs` + `.` + `[type]` + `[label]`.

```json
{
      "version.label": {
        "message": "dev",
        "description": "The label for version current"
      },
      "sidebar.docs.category.Getting Started": {
        "message": "快速开始",
        "description": "The label for category Getting Started in sidebar docs"
      },
      ......
}
```

The corresponding `sidebars.json` snippet:

```json
{
    "docs": [
            {
                "type": "category",
                "label": "Getting Started",
                "items": [
                    "get-starting/quick-start",
                    "get-starting/what-is-apache-doris"
                ]
            },
            ......
         }
     ]
 }
```

### 2.1 / 2.0 / 1.2 Historical Versions

**1. Where to modify content**

| Version | English documentation location | Chinese documentation location |
| --- | --- | --- |
| 2.1 | `/versioned_docs/version-2.1` | `i18n/zh-CN/docusaurus-plugin-content-docs/version-2.1` |
| 2.0 | `/versioned_docs/version-2.0` | `i18n/zh-CN/docusaurus-plugin-content-docs/version-2.0` |
| 1.2 | `/versioned_docs/version-1.2` | `i18n/zh-CN/docusaurus-plugin-content-docs/version-1.2` |

```plain
.
├── blog
├── community
├── docs
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── current
│       │   ├── version-1.2
│       │   ├── version-2.0
│       │   ├── version-2.1
├── versioned_docs
│   ├── version-1.2
│   ├── version-2.0
│   ├── version-2.1
```

**2. Documentation directory structure**

For each version, both Chinese and English documentation are controlled by `version-X.X-sidebars.json` under the root directory `versioned_sidebars/`.

```plain
.
├── versioned_sidebars
│   ├── version-1.2-sidebars.json
│   ├── version-2.0-sidebars.json
│   └── version-2.1-sidebars.json
```

The sidebar hierarchy for each version is modified in essentially the same way as for the Dev version, so no example is given here.

**3. Chinese translation for categories**

The Chinese translation files for the categories of each version are located at `i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X.json`.

```plain
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── version-1.2.json
│       │   ├── version-2.0.json
│       │   ├── version-2.1.json
```

The `label` translation for the Chinese documentation of each version is essentially the same as for the Dev version, so no example is given here.

## Community Documentation Directory

The community documentation is currently a single shared version that does not distinguish between releases.

| Item | Location |
| --- | --- |
| English documentation | `community/` |
| Chinese documentation | `i18n/zh-CN/docusaurus-plugin-content-docs-community/` |
| Directory structure | `sidebarsCommunity.json` |
| Chinese translation | `i18n/zh-CN/docusaurus-plugin-content-docs-community/current.json` |

Example of the Chinese translation file:

```json
{
    "version.label": {
        "message": "Next",
        "description": "The label for version current"
    },
    "sidebar.community.category.How to Contribute": {
        "message": "贡献指南",
        "description": "The label for category How to Contribute in sidebar community"
    },
    "sidebar.community.category.Release Process & Verification": {
        "message": "版本发布与校验",
        "description": "The label for category Release Process & Verification in sidebar community"
    },
    "sidebar.community.category.Design Documents": {
        "message": "设计文档",
        "description": "The label for category Design Documents in sidebar community"
    },
    "sidebar.community.category.Developer Guide": {
        "message": "开发者手册",
        "description": "The label for category Developer Guide in sidebar community"
    }
}
```

## Image Directory

1. All images are placed under the `static/images/` directory.
2. The image reference path format is `![text description](/images/image-name.image-format)`.
    - Text description: customize based on the image content. It is recommended to keep the description close to the title content where the image appears.
    - Image name: when the file name consists of multiple English words, separate the words with a hyphen `-`.

## How to Write the Command Help Manual

<!-- Knowledge type: Rules and conventions -->

The command help manual refers to the documentation under `/sql-manual` in the Master branch and each version of the documentation. These documents are used in two places:

1. Display on the official website documentation.
2. Output of the `HELP` command.

To support `HELP` command output, the documentation must follow the format below strictly. Otherwise, it cannot pass the admission check.

Taking the `SHOW ALTER` command as an example:

```markdown
---
{
    "title": "SHOW-ALTER",
    "language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## SHOW-ALTER

### Name

SHOW ALTER

## Description

(Describes the command syntax.)

## Example

(Provides command examples.)

### Keywords

SHOW, ALTER

### Best Practice

(Best practices, if any.)
```

:::caution Note

Whether for Chinese or English documentation, the headings above must be in English, and the heading levels must be observed.

:::

## Related Documents

- [Documentation Format Specification](./docs-format-specification)
- [How to Share Blogs](./how-to-share-blogs)
