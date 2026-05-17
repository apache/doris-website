---
title: 文档贡献指南
language: zh-CN
description: 如何为 Apache Doris 贡献文档：仓库结构、版本管理、Sidebar 配置与 PR 提交流程。
keywords:
    - Apache Doris
    - 文档贡献
    - doris-website
    - Sidebar 配置
    - 多版本文档
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

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 文档贡献 / 文档修改 PR 提交 -->

本文介绍如何为 Apache Doris 贡献文档，包括官网仓库目录结构、各版本文档的修改位置、Sidebar 与中文翻译文件的配置方式，以及命令帮助手册的编写规范。

不论是历史版本的文档还是最新版本文档，所有改动都在 [apache/doris-website](https://github.com/apache/doris-website) 代码库上提交 PR。

:::tip

PR 提交流程还可以参考：

- [为 Doris 做贡献](./contribute-to-doris)
- [代码提交指南](./pull-request)

:::

## Doris Website 仓库结构

下面是 [apache/doris-website](https://github.com/apache/doris-website) 仓库的主要目录树，贡献文档前请先对照定位需要修改的位置。

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

下表汇总各目录的用途，方便快速定位修改位置。

| 目录 | 内容 | 适用范围 |
| --- | --- | --- |
| `blog/` | 博客文章 Markdown | 所有版本共用 |
| `community/` | 英文社区文档 | 所有版本共用 |
| `docs/` | 英文最新版（Dev / Master）文档 | 当前主干 |
| `versioned_docs/version-X.X/` | 英文历史版本文档 | 1.2 / 2.0 / 2.1 等 |
| `i18n/zh-CN/docusaurus-plugin-content-docs/current/` | 中文最新版文档 | 当前主干 |
| `i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X/` | 中文历史版本文档 | 1.2 / 2.0 / 2.1 等 |
| `i18n/zh-CN/docusaurus-plugin-content-docs-community/` | 中文社区文档 | 所有版本共用 |
| `sidebars.json` | 最新版文档侧边栏 | 中英文共用 |
| `versioned_sidebars/version-X.X-sidebars.json` | 历史版本文档侧边栏 | 中英文共用 |
| `sidebarsCommunity.json` | 社区文档侧边栏 | 所有版本共用 |
| `static/images/` | 文档图片资源 | 所有版本共用 |

## 博客目录

博客目录位于根目录 `/blog` 下，所有博客 Markdown 文件都放在该目录。

如果你想参与博客共建或愿意分享技术心得，欢迎通过邮件 `dev@doris.apache.org` 或直接提交 Blog PR。

## 文档目录

<!-- 知识类型: 操作步骤 -->

修改文档时，根据修改类型需要同时改动不同文件：

1. **修改已有文档内容**：需要同时更新 Master 分支最新文档版本以及相应的各版本（如 2.1、2.0、1.2 或多版本）。
2. **新增文档**：除了上传新的 Markdown 文件，还需要在 Sidebar 文件中添加新文档链接路径。
3. **新增文档目录栏**：除了调整目录结构，还需要对新增的目录栏补充中文翻译。

需要改动的文件类型如下：

| 文件类型 | 作用 | 示例 |
| --- | --- | --- |
| Markdown 文件 | 文档正文内容 | `docs/admin-manual/xxx.md` |
| Sidebar 文件 | 控制目录结构 | `sidebars.json` / `version-2.1-sidebars.json` |
| 翻译文件 | 控制目录栏在中文文档中的显示 | `current.json` / `version-2.1.json` |

:::caution 注意

所有文档必须同时包含中文与英文文档，否则会造成目录结构不一致、中文文档无法显示等问题。这条规则适用于所有博客、文档、社区内容。

:::

### Dev 版本：最新 Master 分支文档

**1. 内容修改位置**

- 英文文档：根目录 `docs/` 下
- 中文文档：`i18n/zh-CN/docusaurus-plugin-content-docs/current/` 下

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

**2. 文档目录结构**

Dev 版本中英文文档统一由根目录下 `sidebars.json` 控制。

`sidebars.json` 示例：

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

**3. 目录栏中文翻译**

Dev 版本的目录栏中文翻译文件位于 `i18n/zh-CN/docusaurus-plugin-content-docs/current.json`。

以目录栏「快速开始」为例：

- `sidebar.docs.category.Getting Started` 与 `sidebars.json` 中的 `label` 层级对应
- 编写格式为：`sidebar` + `.` + `docs` + `.` + `[type]` + `[label]`

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

对应的 `sidebars.json` 片段：

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

### 2.1 / 2.0 / 1.2 历史版本

**1. 内容修改位置**

| 版本 | 英文文档位置 | 中文文档位置 |
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

**2. 文档目录结构**

各版本中英文文档统一由根目录 `versioned_sidebars/` 下的 `version-X.X-sidebars.json` 控制。

```plain
.
├── versioned_sidebars
│   ├── version-1.2-sidebars.json
│   ├── version-2.0-sidebars.json
│   └── version-2.1-sidebars.json
```

各版本 Sidebar 层级修改与 Dev 版本基本一致，此处不再举例。

**3. 目录栏中文翻译**

各版本目录栏的中文翻译文件统一在 `i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X.json`。

```plain
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── version-1.2.json
│       │   ├── version-2.0.json
│       │   ├── version-2.1.json
```

各版本中文文档 `label` 翻译与 Dev 版本基本一致，此处不再举例。

## 社区文档目录

社区文档当前为通用版，不区分版本。

| 项目 | 位置 |
| --- | --- |
| 英文文档 | `community/` |
| 中文文档 | `i18n/zh-CN/docusaurus-plugin-content-docs-community/` |
| 目录结构 | `sidebarsCommunity.json` |
| 中文翻译 | `i18n/zh-CN/docusaurus-plugin-content-docs-community/current.json` |

中文翻译文件示例：

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

## 图片目录

1. 所有图片都放在 `static/images/` 目录下。
2. 图片引用路径格式为 `![文本描述](/images/图片名称.图片格式)`。
    - 文本描述：根据图片内容自定义，建议文本描述贴近该图片所在的标题内容。
    - 图片名称：文件名由多个英文单词组成时，单词之间由短划线 `-` 隔开。

## 如何编写命令帮助手册

<!-- 知识类型: 规则规范 -->

命令帮助手册文档，是指 Master 分支与各版本文档 `/sql-manual` 下的文档。这些文档主要用于两个地方：

1. 官网文档展示。
2. `HELP` 命令的输出。

为了支持 `HELP` 命令输出，文档需要严格按照以下格式排版编写，否则无法通过准入检查。

以 `SHOW ALTER` 命令为例：

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

## 描述

（描述命令语法。）

## 举例

（提供命令示例。）

### Keywords

SHOW, ALTER

### Best Practice

（最佳实践（如有））
```

:::caution 注意

不论中文还是英文文档，以上标题都需使用英文，并且注意标题的层级。

:::

## 相关文档

- [文档格式规范](./docs-format-specification)
- [如何分享 Blog](./how-to-share-blogs)
