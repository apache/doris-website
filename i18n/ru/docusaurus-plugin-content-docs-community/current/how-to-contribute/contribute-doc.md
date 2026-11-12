---
title: Руководство по внесению изменений в документацию
language: ru
description: "Как вносить вклад в документацию Apache Doris: структура репозитория, управление версиями, настройка боковой панели и рабочий процесс отправки PR."
keywords:
    - Apache Doris
    - вклад в документацию
    - doris-website
    - настройка боковой панели
    - многоверсионная документация
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

В этой статье описывается, как вносить вклад в документацию Apache Doris: рассматриваются структура каталогов репозитория веб-сайта, расположение файлов для изменения документации каждой версии, настройка боковой панели и файлов перевода на китайский язык, а также правила написания справочника по командам.

Независимо от того, работаете ли вы с документацией исторических версий или с документацией последней версии, все изменения отправляются в виде PR в репозиторий [apache/doris-website](https://github.com/apache/doris-website).

:::tip

Процесс отправки PR также описан в следующих документах:

- [Руководство по участию в сообществе](./contribute-to-doris.mdx)
- [Руководство по pull request](./pull-request)

:::

## Структура репозитория Doris Website {#doris-website-repository-structure}

Ниже приведено основное дерево каталогов репозитория [apache/doris-website](https://github.com/apache/doris-website). Перед внесением изменений в документацию используйте его, чтобы найти нужное расположение.

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

В таблице ниже приведено назначение каждого каталога, чтобы вы могли быстро найти место для внесения изменений.

| Каталог | Содержимое | Область действия |
| --- | --- | --- |
| `blog/` | Markdown-файлы статей блога | Общий для всех версий |
| `community/` | Англоязычная документация сообщества | Общая для всех версий |
| `docs/` | Документация последней версии на английском языке (Dev / Master) | Текущая основная ветка |
| `versioned_docs/version-X.X/` | Документация выпущенных версий на английском языке | Версии 4.x / 3.x, опубликованные онлайн (перечислены в `versions.json`) |
| `i18n/zh-CN/docusaurus-plugin-content-docs/current/` | Документация последней версии на китайском языке | Текущая основная ветка |
| `i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X/` | Документация выпущенных версий на китайском языке | Версии 4.x / 3.x, опубликованные онлайн (перечислены в `versions.json`) |
| `i18n/zh-CN/docusaurus-plugin-content-docs-community/` | Документация сообщества на китайском языке | Общая для всех версий |
| `sidebars.ts` | Боковая панель документации последней версии | Общая для китайской и английской документации |
| `versioned_sidebars/version-X.X-sidebars.json` | Боковая панель документации выпущенной версии | Общая для китайской и английской документации |
| `sidebarsCommunity.json` | Боковая панель документации сообщества | Общая для всех версий |
| `versions.json` | Выпущенные версии, опубликованные на веб-сайте | Все выпущенные версии |
| `static/images/` | Ресурсы изображений документации | Общие для всех версий |

## Каталог блога {#blog-directory}

Каталог блога находится в `/blog` в корневом каталоге. Все Markdown-файлы блога размещаются в этом каталоге.

Если вы хотите внести вклад в блог или поделиться техническими знаниями, свяжитесь с нами по адресу `dev@doris.apache.org` или отправьте PR для блога напрямую.

## Каталог документации {#documentation-directory}

<!-- Knowledge type: Procedure -->

При изменении документации в зависимости от типа изменения необходимо одновременно изменять разные файлы:

1. **Изменение существующего содержимого документации**: необходимо обновить документацию последней версии в ветке Master и соответствующие выпущенные версии (например, 4.x, 3.x, 2.1 или несколько из них).
2. **Добавление новой документации**: помимо загрузки нового Markdown-файла, необходимо добавить путь ссылки на новую документацию в файле боковой панели.
3. **Добавление новой категории документации**: помимо изменения структуры каталогов, необходимо добавить перевод новой категории на китайский язык.

Ниже перечислены типы изменяемых файлов:

| Тип файла | Назначение | Пример |
| --- | --- | --- |
| Markdown-файл | Основное содержимое документации | `docs/admin-manual/xxx.md` |
| Файл боковой панели | Управляет структурой каталогов | `sidebars.ts` / `version-4.x-sidebars.json` |
| Файл перевода | Управляет отображением категорий в документации на китайском языке | `current.json` / `version-4.x.json` |

:::caution Примечание

Вся документация должна содержать версии на китайском и английском языках. В противном случае структура каталогов станет несогласованной, а документация на китайском языке может не отображаться. Это правило распространяется на всё содержимое блогов, документации и сообщества.

:::

### Версия Dev: документация последней ветки Master {#dev-version-latest-master-branch-documentation}

**1. Где изменять содержимое**

- Документация на английском языке: в каталоге `docs/` корневого каталога
- Документация на китайском языке: в каталоге `i18n/zh-CN/docusaurus-plugin-content-docs/current/`

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

**2. Структура каталогов документации**

В версии Dev документация на китайском и английском языках управляется файлом `sidebars.ts` в корневом каталоге.

Пример `sidebars.ts`:

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

**3. Перевод категорий на китайский язык**

Файл перевода категорий версии Dev на китайский язык находится в `i18n/zh-CN/docusaurus-plugin-content-docs/current.json`.

Рассмотрим в качестве примера категорию "Getting Started":

- `sidebar.docs.category.Getting Started` соответствует иерархии `label` в `sidebars.ts`.
- Формат имеет вид: `sidebar` + `.` + `docs` + `.` + `[type]` + `.` + `[label]`.

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

Соответствующий фрагмент `sidebars.ts`:

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

### Выпущенные версии 4.x / 3.x {#4x--3x--21-released-versions}

**1. Где изменять содержимое**

Выпущенные версии, опубликованные на веб-сайте, перечислены в `versions.json` в корневом каталоге; в настоящее время это 4.x и 3.x. Версии 2.1, 2.0 и 1.2 доступны в формате PDF на странице [Архивные версии](https://doris.apache.org/archived-docs). Исходные каталоги этих версий сохраняются в репозитории для справки, но не включаются в сборку веб-сайта.

| Версия | Расположение документации на английском языке | Расположение документации на китайском языке |
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

**2. Структура каталогов документации**

Для каждой версии документация на китайском и английском языках управляется файлом `version-X.X-sidebars.json` в корневом каталоге `versioned_sidebars/`.

```plain
.
├── versioned_sidebars
│   ├── version-2.1-sidebars.json
│   ├── version-3.x-sidebars.json
│   └── version-4.x-sidebars.json
```

Файлы боковой панели версий имеют формат JSON, но используют ту же структуру, что и `sidebars.ts`. Иерархия боковой панели каждой версии изменяется практически так же, как и для версии Dev, поэтому пример здесь не приводится.

**3. Перевод категорий на китайский язык**

Файлы перевода категорий каждой версии на китайский язык находятся в `i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X.json`.

```plain
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── version-2.1.json
│       │   ├── version-3.x.json
│       │   ├── version-4.x.json
```

Перевод `label` в документации каждой версии на китайский язык практически совпадает с переводом для версии Dev, поэтому пример здесь не приводится.

## Каталог документации сообщества {#community-documentation-directory}

Документация сообщества в настоящее время представлена одной общей версией без разделения по выпускам.

| Элемент | Расположение |
| --- | --- |
| Документация на английском языке | `community/` |
| Документация на китайском языке | `i18n/zh-CN/docusaurus-plugin-content-docs-community/` |
| Структура каталогов | `sidebarsCommunity.json` |
| Перевод на китайский язык | `i18n/zh-CN/docusaurus-plugin-content-docs-community/current.json` |

Пример файла перевода на китайский язык:

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

## Каталог изображений {#image-directory}

1. Все изображения размещаются в каталоге `static/images/`.
2. Формат ссылки на изображение: `![text description](/images/image-name.image-format)`.
    - Текстовое описание: задаётся в соответствии с содержимым изображения. Рекомендуется, чтобы описание было связано с заголовком, рядом с которым размещено изображение.
    - Имя изображения: если имя файла состоит из нескольких английских слов, разделяйте слова дефисом `-`.

## Как писать справочник по командам {#how-to-write-the-command-help-manual}

<!-- Knowledge type: Rules and conventions -->

Справочник по командам — это документация в каталоге `/sql-manual` ветки Master и каждой версии документации. Эти документы используются в двух местах:

1. Отображаются в официальной документации веб-сайта.
2. Выводятся командой `HELP`.

Чтобы поддерживать вывод команды `HELP`, документация должна строго соответствовать приведённому ниже формату. В противном случае она не пройдёт проверку допуска.

В качестве примера рассмотрим команду `SHOW ALTER`:

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

:::caution Примечание

Независимо от того, предназначена ли документация для китайского или английского языка, приведённые выше заголовки должны быть написаны на английском языке, а уровни заголовков должны соблюдаться.

:::

## Связанные документы {#related-documents}

- [Спецификация формата документации](./docs-format-specification)
- [Как делиться блогами](./how-to-share-blogs)
