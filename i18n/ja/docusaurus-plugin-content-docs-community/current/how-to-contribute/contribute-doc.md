---
title: ドキュメントへの貢献ガイド
language: ja
description: "Apache Doris のドキュメントへの貢献方法。リポジトリ構成、バージョン管理、サイドバーの設定、PR の提出手順を説明します。"
keywords:
    - Apache Doris
    - ドキュメントへの貢献
    - doris-website
    - サイドバーの設定
    - 複数バージョンのドキュメント
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

この記事では、Apache Doris のドキュメントへの貢献方法を説明します。Web サイトのリポジトリ構成、バージョンごとのドキュメントの変更箇所、サイドバーと中国語翻訳ファイルの設定方法、コマンドヘルプマニュアルの記述規則を取り上げます。

過去のバージョンと最新バージョンのどちらのドキュメントを変更する場合も、すべての変更は [apache/doris-website](https://github.com/apache/doris-website) リポジトリへの PR として提出します。

:::tip

PR の提出手順については、次のページも参照してください。

- [コミュニティへの貢献ガイド](./contribute-to-doris.mdx)
- [プルリクエストガイド](./pull-request)

:::

## Doris Web サイトのリポジトリ構成

以下は [apache/doris-website](https://github.com/apache/doris-website) リポジトリの主なディレクトリ構成です。ドキュメントに貢献する前に、変更する箇所を確認してください。

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

次の表に各ディレクトリの用途を示します。変更箇所を探す際に利用してください。

| ディレクトリ | 内容 | 対象範囲 |
| --- | --- | --- |
| `blog/` | ブログ記事の Markdown ファイル | 全バージョンで共通 |
| `community/` | 英語のコミュニティドキュメント | 全バージョンで共通 |
| `docs/` | 最新バージョン（Dev / Master）の英語ドキュメント | 現在のメインブランチ |
| `versioned_docs/version-X.X/` | 過去のバージョンの英語ドキュメント | 1.2 / 2.0 / 2.1 など |
| `i18n/zh-CN/docusaurus-plugin-content-docs/current/` | 最新バージョンの中国語ドキュメント | 現在のメインブランチ |
| `i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X/` | 過去のバージョンの中国語ドキュメント | 1.2 / 2.0 / 2.1 など |
| `i18n/zh-CN/docusaurus-plugin-content-docs-community/` | 中国語のコミュニティドキュメント | 全バージョンで共通 |
| `sidebars.json` | 最新バージョンのドキュメントのサイドバー | 中国語と英語で共通 |
| `versioned_sidebars/version-X.X-sidebars.json` | 過去のバージョンのドキュメントのサイドバー | 中国語と英語で共通 |
| `sidebarsCommunity.json` | コミュニティドキュメントのサイドバー | 全バージョンで共通 |
| `static/images/` | ドキュメントの画像リソース | 全バージョンで共通 |

## ブログディレクトリ

ブログディレクトリはルートディレクトリ直下の `/blog` にあります。ブログ記事の Markdown ファイルはすべてこのディレクトリに配置します。

ブログに寄稿したり技術的な知見を共有したりする場合は、`dev@doris.apache.org` に連絡するか、ブログの PR を直接提出してください。

## ドキュメントディレクトリ

<!-- Knowledge type: Procedure -->

ドキュメントを変更するときは、変更の種類に応じて、次のファイルも同時に変更する必要があります。

1. **既存のドキュメントの内容を変更する場合**：Master ブランチの最新バージョンと、対応するバージョンブランチ（2.1、2.0、1.2 など。複数の場合もあります）の両方を更新する必要があります。
2. **新しいドキュメントを追加する場合**：新しい Markdown ファイルの追加に加え、サイドバーファイルにそのドキュメントへのリンクパスを追加する必要があります。
3. **新しいドキュメントカテゴリを追加する場合**：ディレクトリ構成の調整に加え、新しいカテゴリの中国語訳を追加する必要があります。

変更が必要なファイルの種類は次のとおりです。

| ファイルの種類 | 用途 | 例 |
| --- | --- | --- |
| Markdown ファイル | ドキュメント本文 | `docs/admin-manual/xxx.md` |
| サイドバーファイル | ディレクトリ構成を制御する | `sidebars.json` / `version-2.1-sidebars.json` |
| 翻訳ファイル | 中国語ドキュメントでのカテゴリの表示を制御する | `current.json` / `version-2.1.json` |

:::caution 注意

すべてのドキュメントには中国語版と英語版の両方が必要です。どちらかが欠けると、ディレクトリ構成に不整合が生じ、中国語ドキュメントが表示されない場合があります。この規則は、ブログ、ドキュメント、コミュニティコンテンツのすべてに適用されます。

:::

### Dev バージョン：Master ブランチの最新ドキュメント

**1. 内容の変更箇所**

- 英語ドキュメント：ルートディレクトリ直下の `docs/`
- 中国語ドキュメント：`i18n/zh-CN/docusaurus-plugin-content-docs/current/`

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

**2. ドキュメントのディレクトリ構成**

Dev バージョンでは、中国語と英語のドキュメントの両方が、ルートディレクトリの `sidebars.json` によって制御されます。

`sidebars.json` の例：

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

**3. カテゴリの中国語訳**

Dev バージョンのカテゴリの中国語翻訳ファイルは、`i18n/zh-CN/docusaurus-plugin-content-docs/current.json` にあります。

カテゴリ「Getting Started」を例に説明します。

- `sidebar.docs.category.Getting Started` は、`label` の階層に対応します。この階層は `sidebars.json` で定義されています。
- 形式は `sidebar` + `.` + `docs` + `.` + `[type]` + `[label]` です。

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

対応する `sidebars.json` の抜粋：

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

### 過去のバージョン：2.1 / 2.0 / 1.2

**1. 内容の変更箇所**

| バージョン | 英語ドキュメントの場所 | 中国語ドキュメントの場所 |
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

**2. ドキュメントのディレクトリ構成**

各バージョンの中国語と英語のドキュメントは、`version-X.X-sidebars.json` によって制御されます。このファイルは、ルートディレクトリの `versioned_sidebars/` にあります。

```plain
.
├── versioned_sidebars
│   ├── version-1.2-sidebars.json
│   ├── version-2.0-sidebars.json
│   └── version-2.1-sidebars.json
```

各バージョンのサイドバー階層は、基本的に Dev バージョンと同じ方法で変更するため、ここでは例を省略します。

**3. カテゴリの中国語訳**

各バージョンのカテゴリの中国語翻訳ファイルは、`i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X.json` にあります。

```plain
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── version-1.2.json
│       │   ├── version-2.0.json
│       │   ├── version-2.1.json
```

各バージョンの中国語ドキュメントの `label` の翻訳方法は、基本的に Dev バージョンと同じため、ここでは例を省略します。

## コミュニティドキュメントのディレクトリ

コミュニティドキュメントは現在、リリースごとに分かれておらず、単一のバージョンを共通で使用します。

| 項目 | 場所 |
| --- | --- |
| 英語ドキュメント | `community/` |
| 中国語ドキュメント | `i18n/zh-CN/docusaurus-plugin-content-docs-community/` |
| ディレクトリ構成 | `sidebarsCommunity.json` |
| 中国語訳 | `i18n/zh-CN/docusaurus-plugin-content-docs-community/current.json` |

中国語翻訳ファイルの例：

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

## 画像ディレクトリ

1. すべての画像は `static/images/` ディレクトリに配置します。
2. 画像の参照パスは `![text description](/images/image-name.image-format)` という形式にします。
    - テキストによる説明：画像の内容に合わせて設定します。画像が掲載される箇所の見出しに近い内容にすることを推奨します。
    - 画像ファイル名：複数の英単語で構成される場合は、単語をハイフン `-` で区切ります。

## コマンドヘルプマニュアルの書き方

<!-- Knowledge type: Rules and conventions -->

コマンドヘルプマニュアルとは、Master ブランチおよび各バージョンのドキュメントにある `/sql-manual` 以下の文書を指します。これらの文書は次の二つの場所で使用されます。

1. 公式 Web サイトのドキュメントでの表示。
2. `HELP` コマンドの出力。

`HELP` コマンドの出力に対応するため、ドキュメントは以下の形式を厳密に守る必要があります。守らない場合、受け入れチェックに合格できません。

`SHOW ALTER` コマンドを例に示します。

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

:::caution 注意

中国語と英語のどちらのドキュメントでも、上記の見出しは英語にし、見出しのレベルを守る必要があります。

:::

## 関連ドキュメント

- [ドキュメントの書式仕様](./docs-format-specification)
- [ブログの共有方法](./how-to-share-blogs)
