---
title: ドキュメント貢献ガイド
language: ja
description: "Apache Doris のドキュメントに貢献する方法。リポジトリ構成、バージョン管理、サイドバーの設定、PR の提出手順を説明します。"
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

この記事では、Apache Doris のドキュメントに貢献する方法を説明します。Web サイトのリポジトリ構成、各バージョンのドキュメントを修正する場所、サイドバーと中国語翻訳ファイルの設定方法、コマンドヘルプマニュアルの記述規則を取り上げます。

過去のバージョンと最新バージョンのどちらのドキュメントを扱う場合も、すべての変更は [apache/doris-website](https://github.com/apache/doris-website) リポジトリに PR として提出します。

:::tip

PR の提出手順については、以下も参照してください。

- [コミュニティ貢献ガイド](./contribute-to-doris.mdx)
- [Pull Request ガイド](./pull-request)

:::

## Doris Web サイトのリポジトリ構成 {#doris-website-repository-structure}

以下は [apache/doris-website](https://github.com/apache/doris-website) リポジトリの主なディレクトリツリーです。ドキュメントに貢献する前に、修正する場所を確認してください。

```plain
.
├── blog
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
│   │   ├── auth
│   │   ├── cluster-management
│   │   ├── config
│   │   ├── data-admin
│   │   ├── log-management
│   │   ├── maint-monitor
│   │   ├── open-api
│   │   ├── system-tables
│   │   ├── trouble-shooting
│   │   ├── workload-management
│   │   └── audit-plugin.md
│   ├── ......
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── current
│       │   ├── version-2.1
│       │   ├── version-3.x
│       │   ├── version-4.x
│       │   ├── current.json
│       │   ├── version-2.1.json
│       │   ├── version-3.x.json
│       │   └── version-4.x.json
│       └── docusaurus-plugin-content-docs-community
├── src
│   ├── components
│   │   ├── Icons
│   │   ├── More
│   │   ├── PageColumn
│   │   └── PageHeader
│   ├── ......
├── static
│   ├── images
│   │   ├── Bloom_filter.svg.png
│   │   ├── .....
│   └── js
│       └── redirect.js
├── versioned_docs
│   ├── version-2.1
│   ├── version-3.x
│   └── version-4.x
├── versioned_sidebars
│   ├── version-2.1-sidebars.json
│   ├── version-3.x-sidebars.json
│   └── version-4.x-sidebars.json
├── build.sh
├── docusaurus.config.js
├── local_build_docs.sh
├── package.json
├── README.md
├── sidebars.ts
├── sidebarsCommunity.json
├── tsconfig.json
└── versions.json
```

以下の表に各ディレクトリの用途をまとめました。変更する場所を探す際に利用してください。

| ディレクトリ | 内容 | 適用範囲 |
| --- | --- | --- |
| `blog/` | ブログ記事の Markdown ファイル | すべてのバージョンで共通 |
| `community/` | 英語のコミュニティドキュメント | すべてのバージョンで共通 |
| `docs/` | 英語の最新バージョン（Dev / Master）のドキュメント | 現在のメインブランチ |
| `versioned_docs/version-X.X/` | リリース済みバージョンの英語ドキュメント | Web サイトで公開されている 4.x / 3.x（`versions.json` に記載） |
| `i18n/zh-CN/docusaurus-plugin-content-docs/current/` | 中国語の最新バージョンのドキュメント | 現在のメインブランチ |
| `i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X/` | リリース済みバージョンの中国語ドキュメント | Web サイトで公開されている 4.x / 3.x（`versions.json` に記載） |
| `i18n/zh-CN/docusaurus-plugin-content-docs-community/` | 中国語のコミュニティドキュメント | すべてのバージョンで共通 |
| `sidebars.ts` | 最新バージョンのドキュメントのサイドバー | 中国語と英語で共通 |
| `versioned_sidebars/version-X.X-sidebars.json` | リリース済みバージョンのドキュメントのサイドバー | 中国語と英語で共通 |
| `sidebarsCommunity.json` | コミュニティドキュメントのサイドバー | すべてのバージョンで共通 |
| `versions.json` | Web サイトで公開されているリリース済みバージョン | すべてのリリース済みバージョン |
| `static/images/` | ドキュメントの画像リソース | すべてのバージョンで共通 |

## ブログディレクトリ {#blog-directory}

ブログディレクトリはルートディレクトリ直下の `/blog` にあります。ブログの Markdown ファイルはすべてこのディレクトリに配置します。

ブログに貢献したい場合や技術的な知見を共有したい場合は、`dev@doris.apache.org` までご連絡いただくか、ブログの PR を直接提出してください。

## ドキュメントディレクトリ {#documentation-directory}

<!-- Knowledge type: Procedure -->

ドキュメントを修正する際は、変更の種類に応じて、複数のファイルをあわせて修正する必要があります。

1. **既存のドキュメントの内容を修正する場合**：Master ブランチの最新バージョンのドキュメントと、該当するリリース済みバージョン（4.x、3.x、2.1、またはそのうちの複数）を更新します。
2. **新しいドキュメントを追加する場合**：新しい Markdown ファイルを追加するだけでなく、サイドバーファイルにも新しいドキュメントへのリンクパスを追加します。
3. **新しいドキュメントカテゴリを追加する場合**：ディレクトリ構成を調整するだけでなく、新しいカテゴリの中国語訳も追加します。

修正が必要なファイルの種類は次のとおりです。

| ファイルの種類 | 用途 | 例 |
| --- | --- | --- |
| Markdown ファイル | ドキュメントの本文 | `docs/admin-manual/xxx.md` |
| サイドバーファイル | ディレクトリ構成の制御 | `sidebars.ts` / `version-4.x-sidebars.json` |
| 翻訳ファイル | 中国語ドキュメントでのカテゴリの表示を制御 | `current.json` / `version-4.x.json` |

:::caution 注意

すべてのドキュメントには中国語版と英語版の両方が必要です。どちらかが欠けるとディレクトリ構成に不整合が生じ、中国語ドキュメントが表示されない可能性があります。この規則は、ブログ、ドキュメント、コミュニティのすべてのコンテンツに適用されます。

:::

### Dev バージョン：最新の Master ブランチのドキュメント {#dev-version-latest-master-branch-documentation}

**1. 内容を修正する場所**

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

Dev バージョンでは、中国語と英語のドキュメントの両方を、ルートディレクトリの `sidebars.ts` で制御します。

`sidebars.ts` の例：

```ts
const sidebars: SidebarsConfig = {
    docs: [
        {
            type: 'category',
            label: 'Get Started',
            collapsible: false,
            collapsed: false,
            items: [
                {
                    type: 'category',
                    label: 'Getting Started',
                    link: {type: 'doc', id: 'getting-started/intro'},
                    collapsed: true,
                    items: [
                        'getting-started/what-is-apache-doris',
                        'getting-started/quick-start',
                        'getting-started/before-you-start-the-poc',
                    ],
                },
                ......
            ],
        },
        ......
    ],
};
```

**3. カテゴリの中国語訳**

Dev バージョンのカテゴリの中国語翻訳ファイルは、`i18n/zh-CN/docusaurus-plugin-content-docs/current.json` にあります。

「Getting Started」カテゴリを例に説明します。

- `sidebar.docs.category.Getting Started` は、`label` による `sidebars.ts` 内の階層に対応します。
- 書式は、`sidebar` + `.` + `docs` + `.` + `[type]` + `.` + `[label]` です。

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

対応する `sidebars.ts` の抜粋：

```ts
{
    type: 'category',
    label: 'Getting Started',
    link: {type: 'doc', id: 'getting-started/intro'},
    collapsed: true,
    items: [
        'getting-started/what-is-apache-doris',
        'getting-started/quick-start',
        'getting-started/before-you-start-the-poc',
    ],
},
```

### 4.x / 3.x のリリース済みバージョン {#4x--3x--21-released-versions}

**1. 内容を修正する場所**

Web サイトで公開されているリリース済みバージョンは、ルートディレクトリの `versions.json` に記載されています。現在は 4.x と 3.x です。バージョン 2.1、2.0、1.2 は、[アーカイブ済みバージョン](https://doris.apache.org/archived-docs)のページで PDF として入手できます。これらのソースディレクトリは参照用にリポジトリに残されていますが、Web サイトにはビルドされません。

| バージョン | 英語ドキュメントの場所 | 中国語ドキュメントの場所 |
| --- | --- | --- |
| 4.x | `/versioned_docs/version-4.x` | `i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x` |
| 3.x | `/versioned_docs/version-3.x` | `i18n/zh-CN/docusaurus-plugin-content-docs/version-3.x` |

```plain
.
├── blog
├── community
├── docs
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── current
│       │   ├── version-2.1
│       │   ├── version-3.x
│       │   ├── version-4.x
├── versioned_docs
│   ├── version-2.1
│   ├── version-3.x
│   ├── version-4.x
```

**2. ドキュメントのディレクトリ構成**

各バージョンの中国語と英語のドキュメントは、ルートディレクトリの `versioned_sidebars/` にある `version-X.X-sidebars.json` で制御します。

```plain
.
├── versioned_sidebars
│   ├── version-2.1-sidebars.json
│   ├── version-3.x-sidebars.json
│   └── version-4.x-sidebars.json
```

各バージョンのサイドバーファイルは JSON 形式ですが、構造は `sidebars.ts` と同じです。サイドバーの階層を変更する方法も Dev バージョンとほぼ同じため、ここでは例を省略します。

**3. カテゴリの中国語訳**

各バージョンのカテゴリの中国語翻訳ファイルは、`i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X.json` にあります。

```plain
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── version-2.1.json
│       │   ├── version-3.x.json
│       │   ├── version-4.x.json
```

各バージョンの中国語ドキュメントでの `label` の翻訳方法は Dev バージョンとほぼ同じため、ここでは例を省略します。

## コミュニティドキュメントのディレクトリ {#community-documentation-directory}

コミュニティドキュメントは現在、リリースごとに分かれていない共通のバージョンです。

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
        "message": "current",
        "description": "The label for version current"
    },
    "sidebar.community.category.How to Contribute": {
        "message": "参与贡献",
        "description": "The label for category How to Contribute in sidebar community"
    },
    "sidebar.community.category.Documentation Contribution": {
        "message": "贡献文档",
        "description": "The label for category Documentation Contribution in sidebar community"
    },
    "sidebar.community.category.Release": {
        "message": "版本与发布",
        "description": "The label for category Release in sidebar community"
    },
    "sidebar.community.category.Design Documents": {
        "message": "设计文档",
        "description": "The label for category Design Documents in sidebar community"
    }
}
```

## 画像ディレクトリ {#image-directory}

1. すべての画像を `static/images/` ディレクトリに配置します。
2. 画像の参照パスの書式は `![text description](/images/image-name.image-format)` です。
    - テキストの説明：画像の内容に応じて記述します。画像が掲載される見出しの内容に近い説明を推奨します。
    - 画像名：ファイル名が複数の英単語からなる場合は、単語をハイフン `-` で区切ります。

## コマンドヘルプマニュアルの書き方 {#how-to-write-the-command-help-manual}

<!-- Knowledge type: Rules and conventions -->

コマンドヘルプマニュアルとは、Master ブランチと各バージョンのドキュメントの `/sql-manual` 以下にあるドキュメントを指します。これらは次の用途で使用されます。

1. 公式 Web サイトのドキュメントでの表示。
2. `HELP` コマンドの出力。

`HELP` コマンドの出力に対応するため、ドキュメントは以下の書式に厳密に従う必要があります。従わない場合、受け入れチェックに合格できません。

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

中国語と英語のどちらのドキュメントでも、上記の見出しは英語で記述し、見出しの階層を守る必要があります。

:::

## 関連ドキュメント {#related-documents}

- [ドキュメントの書式仕様](./docs-format-specification)
- [ブログを共有する方法](./how-to-share-blogs)
