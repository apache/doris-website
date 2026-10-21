---
title: 문서 기여 가이드
language: ko
description: "Apache Doris 문서에 기여하는 방법: 저장소 구조, 버전 관리, 사이드바 구성 및 PR 제출 절차."
keywords:
    - Apache Doris
    - 문서 기여
    - doris-website
    - 사이드바 구성
    - 다중 버전 문서
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

이 문서는 Apache Doris 문서에 기여하는 방법을 설명합니다. 웹사이트 저장소의 디렉터리 구조, 버전별 문서 수정 위치, 사이드바와 중국어 번역 파일 구성 방법, 명령어 도움말 매뉴얼 작성 규칙을 다룹니다.

이전 버전이든 최신 버전이든 모든 문서 변경 사항은 [apache/doris-website](https://github.com/apache/doris-website) 저장소에 PR로 제출합니다.

:::tip

PR 제출 절차는 다음 문서도 참고할 수 있습니다:

- [커뮤니티 기여 가이드](./contribute-to-doris.mdx)
- [Pull Request 가이드](./pull-request)

:::

## Doris 웹사이트 저장소 구조 {#doris-website-repository-structure}

다음은 [apache/doris-website](https://github.com/apache/doris-website) 저장소의 주요 디렉터리 트리입니다. 문서에 기여하기 전에 이 구조를 참고하여 수정할 위치를 확인하세요.

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

다음 테이블에는 변경할 위치를 빠르게 찾을 수 있도록 각 디렉터리의 용도를 정리했습니다.

| 디렉터리 | 내용 | 적용 범위 |
| --- | --- | --- |
| `blog/` | 블로그 게시글 Markdown 파일 | 모든 버전에서 공유 |
| `community/` | 영어 커뮤니티 문서 | 모든 버전에서 공유 |
| `docs/` | 영어 최신 버전(Dev / Master) 문서 | 현재 메인 브랜치 |
| `versioned_docs/version-X.X/` | 영어 릴리스 버전 문서 | 4.x / 3.x / 2.1(`versions.json`에 나열됨) |
| `i18n/zh-CN/docusaurus-plugin-content-docs/current/` | 중국어 최신 버전 문서 | 현재 메인 브랜치 |
| `i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X/` | 중국어 릴리스 버전 문서 | 4.x / 3.x / 2.1(`versions.json`에 나열됨) |
| `i18n/zh-CN/docusaurus-plugin-content-docs-community/` | 중국어 커뮤니티 문서 | 모든 버전에서 공유 |
| `sidebars.ts` | 최신 버전 문서의 사이드바 | 중국어와 영어에서 공유 |
| `versioned_sidebars/version-X.X-sidebars.json` | 릴리스 버전 문서의 사이드바 | 중국어와 영어에서 공유 |
| `sidebarsCommunity.json` | 커뮤니티 문서의 사이드바 | 모든 버전에서 공유 |
| `versions.json` | 웹사이트에 게시되는 릴리스 버전 | 모든 릴리스 버전 |
| `static/images/` | 문서 이미지 리소스 | 모든 버전에서 공유 |

## 블로그 디렉터리 {#blog-directory}

블로그 디렉터리는 루트 디렉터리의 `/blog`에 있습니다. 모든 블로그 Markdown 파일을 이 디렉터리에 둡니다.

블로그에 기여하거나 기술적 통찰을 공유하고 싶다면 `dev@doris.apache.org`로 문의하거나 블로그 PR을 직접 제출해 주세요.

## 문서 디렉터리 {#documentation-directory}

<!-- Knowledge type: Procedure -->

문서를 수정할 때는 변경 유형에 따라 여러 파일을 함께 수정해야 합니다:

1. **기존 문서 내용 수정**: Master 브랜치의 최신 문서와 해당 릴리스 버전의 문서를 모두 업데이트해야 합니다(예: 4.x, 3.x, 2.1 또는 그중 여러 버전).
2. **새 문서 추가**: 새 Markdown 파일을 업로드하는 것과 함께 사이드바 파일에 새 문서의 링크 경로도 추가해야 합니다.
3. **새 문서 카테고리 추가**: 디렉터리 구조를 조정하는 것과 함께 새 카테고리의 중국어 번역도 추가해야 합니다.

수정해야 하는 파일 유형은 다음과 같습니다:

| 파일 유형 | 용도 | 예시 |
| --- | --- | --- |
| Markdown 파일 | 문서 본문 내용 | `docs/admin-manual/xxx.md` |
| 사이드바 파일 | 디렉터리 구조 관리 | `sidebars.ts` / `version-4.x-sidebars.json` |
| 번역 파일 | 중국어 문서에서 카테고리가 표시되는 방식 관리 | `current.json` / `version-4.x.json` |

:::caution 참고

모든 문서는 중국어 버전과 영어 버전을 모두 제공해야 합니다. 그렇지 않으면 디렉터리 구조가 일치하지 않아 중국어 문서가 표시되지 않을 수 있습니다. 이 규칙은 모든 블로그, 문서 및 커뮤니티 콘텐츠에 적용됩니다.

:::

### Dev 버전: 최신 Master 브랜치 문서 {#dev-version-latest-master-branch-documentation}

**1. 내용 수정 위치**

- 영어 문서: 루트 디렉터리의 `docs/` 아래
- 중국어 문서: `i18n/zh-CN/docusaurus-plugin-content-docs/current/` 아래

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

**2. 문서 디렉터리 구조**

Dev 버전의 중국어 및 영어 문서는 모두 루트 디렉터리의 `sidebars.ts`로 관리합니다.

`sidebars.ts` 예시:

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

**3. 카테고리의 중국어 번역**

Dev 버전 카테고리의 중국어 번역 파일은 `i18n/zh-CN/docusaurus-plugin-content-docs/current.json`에 있습니다.

"시작하기" 카테고리를 예로 들면 다음과 같습니다:

- `sidebar.docs.category.Getting Started`는 `label` 계층 구조에 대응합니다. 이 구조는 `sidebars.ts`에 정의되어 있습니다.
- 형식은 다음과 같습니다: `sidebar` + `.` + `docs` + `.` + `[type]` + `.` + `[label]`.

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

이에 대응하는 `sidebars.ts` 일부는 다음과 같습니다:

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

### 4.x / 3.x / 2.1 릴리스 버전 {#4x--3x--21-released-versions}

**1. 내용 수정 위치**

웹사이트에 게시되는 릴리스 버전은 루트 디렉터리의 `versions.json`에 나열되어 있으며, 현재는 4.x, 3.x, 2.1입니다. 저장소에는 `version-1.2`와 `version-2.0` 디렉터리가 아직 남아 있지만, 이 디렉터리는 `versions.json`에 나열되어 있지 않으며 웹사이트에 빌드되지 않습니다.

| 버전 | 영어 문서 위치 | 중국어 문서 위치 |
| --- | --- | --- |
| 4.x | `/versioned_docs/version-4.x` | `i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x` |
| 3.x | `/versioned_docs/version-3.x` | `i18n/zh-CN/docusaurus-plugin-content-docs/version-3.x` |
| 2.1 | `/versioned_docs/version-2.1` | `i18n/zh-CN/docusaurus-plugin-content-docs/version-2.1` |

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

**2. 문서 디렉터리 구조**

각 버전의 중국어 및 영어 문서는 모두 `version-X.X-sidebars.json`으로 관리합니다. 이 파일은 루트 디렉터리의 `versioned_sidebars/` 아래에 있습니다.

```plain
.
├── versioned_sidebars
│   ├── version-2.1-sidebars.json
│   ├── version-3.x-sidebars.json
│   └── version-4.x-sidebars.json
```

릴리스 버전의 사이드바 파일은 JSON 형식이지만 `sidebars.ts`와 같은 구조를 사용합니다. 각 버전의 사이드바 계층 구조를 수정하는 방법은 Dev 버전과 기본적으로 같으므로 여기서는 예시를 생략합니다.

**3. 카테고리의 중국어 번역**

각 버전 카테고리의 중국어 번역 파일은 `i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X.json`에 있습니다.

```plain
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── version-2.1.json
│       │   ├── version-3.x.json
│       │   ├── version-4.x.json
```

각 버전의 중국어 문서에 대한 `label` 번역 방법은 Dev 버전과 기본적으로 같으므로 여기서는 예시를 생략합니다.

## 커뮤니티 문서 디렉터리 {#community-documentation-directory}

커뮤니티 문서는 현재 릴리스별로 구분하지 않고 공유하는 단일 버전으로 제공됩니다.

| 항목 | 위치 |
| --- | --- |
| 영어 문서 | `community/` |
| 중국어 문서 | `i18n/zh-CN/docusaurus-plugin-content-docs-community/` |
| 디렉터리 구조 | `sidebarsCommunity.json` |
| 중국어 번역 | `i18n/zh-CN/docusaurus-plugin-content-docs-community/current.json` |

중국어 번역 파일 예시:

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

## 이미지 디렉터리 {#image-directory}

1. 모든 이미지는 `static/images/` 디렉터리에 둡니다.
2. 이미지 참조 경로 형식은 `![text description](/images/image-name.image-format)`입니다.
    - 텍스트 설명: 이미지 내용에 맞게 작성합니다. 이미지가 나오는 부분의 제목 내용과 연관된 설명을 사용하는 것이 좋습니다.
    - 이미지 이름: 파일 이름이 여러 영어 단어로 구성된 경우 하이픈 `-`으로 단어를 구분합니다.

## 명령어 도움말 매뉴얼 작성 방법 {#how-to-write-the-command-help-manual}

<!-- Knowledge type: Rules and conventions -->

명령어 도움말 매뉴얼은 Master 브랜치와 각 버전 문서의 `/sql-manual` 아래에 있는 문서를 말합니다. 이 문서는 다음 두 곳에서 사용됩니다:

1. 공식 웹사이트 문서에 표시됩니다.
2. `HELP` 명령어의 출력에 사용됩니다.

`HELP` 명령어 출력을 지원하려면 문서는 아래 형식을 엄격히 따라야 합니다. 그렇지 않으면 검증을 통과할 수 없습니다.

`SHOW ALTER` 명령어를 예로 들면 다음과 같습니다:

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

:::caution 참고

중국어 문서와 영어 문서 모두 위의 제목을 영어로 작성해야 하며, 제목 수준도 준수해야 합니다.

:::

## 관련 문서 {#related-documents}

- [문서 형식 명세](./docs-format-specification)
- [블로그 공유 방법](./how-to-share-blogs)
