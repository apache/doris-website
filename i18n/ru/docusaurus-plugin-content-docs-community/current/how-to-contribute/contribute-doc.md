---
title: Руководство по участию в работе над документацией
language: ru
description: "Как участвовать в работе над документацией Apache Doris: структура репозитория, управление версиями, настройка бокового меню и порядок отправки PR."
keywords:
    - Apache Doris
    - участие в работе над документацией
    - doris-website
    - настройка бокового меню
    - документация для нескольких версий
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

В этой статье описано, как участвовать в работе над документацией Apache Doris: как устроены каталоги репозитория сайта, где изменять документацию для каждой версии, как настраивать боковое меню и файлы перевода на китайский язык, а также какие правила оформления действуют для справочника команд.

Независимо от того, работаете ли вы над документацией прошлых версий или последней версии, все изменения отправляются в виде PR в репозиторий [apache/doris-website](https://github.com/apache/doris-website).

:::tip

О порядке отправки PR также можно прочитать в следующих руководствах:

- [Руководство по участию в сообществе](./contribute-to-doris.mdx)
- [Руководство по Pull Request](./pull-request)

:::

## Структура репозитория сайта Doris {#doris-website-repository-structure}

Ниже показано основное дерево каталогов репозитория [apache/doris-website](https://github.com/apache/doris-website). Прежде чем вносить изменения в документацию, найдите в нём нужное место.

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

В следующей таблице кратко описано назначение каждого каталога, чтобы вы могли быстро найти нужное место для изменений.

| Каталог | Содержимое | Область действия |
| --- | --- | --- |
| `blog/` | Файлы статей блога в формате Markdown | Общие для всех версий |
| `community/` | Документация сообщества на английском языке | Общая для всех версий |
| `docs/` | Документация последней версии (Dev / Master) на английском языке | Текущая основная ветка |
| `versioned_docs/version-X.X/` | Документация выпущенных версий на английском языке | 4.x / 3.x / 2.1 (перечислены в `versions.json`) |
| `i18n/zh-CN/docusaurus-plugin-content-docs/current/` | Документация последней версии на китайском языке | Текущая основная ветка |
| `i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X/` | Документация выпущенных версий на китайском языке | 4.x / 3.x / 2.1 (перечислены в `versions.json`) |
| `i18n/zh-CN/docusaurus-plugin-content-docs-community/` | Документация сообщества на китайском языке | Общая для всех версий |
| `sidebars.ts` | Боковое меню документации последней версии | Общее для китайского и английского языков |
| `versioned_sidebars/version-X.X-sidebars.json` | Боковое меню документации выпущенной версии | Общее для китайского и английского языков |
| `sidebarsCommunity.json` | Боковое меню документации сообщества | Общее для всех версий |
| `versions.json` | Выпущенные версии, опубликованные на сайте | Все выпущенные версии |
| `static/images/` | Изображения для документации | Общие для всех версий |

## Каталог блога {#blog-directory}

Каталог блога расположен в `/blog` в корне репозитория. В этом каталоге размещаются все файлы блога в формате Markdown.

Если вы хотите внести вклад в блог или поделиться техническим опытом, свяжитесь с нами по адресу `dev@doris.apache.org` или сразу отправьте PR со статьёй для блога.

## Каталог документации {#documentation-directory}

<!-- Knowledge type: Procedure -->

При изменении документации в зависимости от типа изменений нужно одновременно обновлять разные файлы:

1. **Изменение содержимого существующей документации**: необходимо обновить как документацию последней версии в ветке Master, так и документацию соответствующих выпущенных версий (например, 4.x, 3.x, 2.1 или нескольких из них).
2. **Добавление новой документации**: помимо загрузки нового файла Markdown необходимо добавить путь ссылки на новую документацию в файл бокового меню.
3. **Добавление новой категории документации**: помимо изменения структуры каталогов необходимо добавить перевод названия новой категории на китайский язык.

Ниже перечислены типы файлов, которые требуется изменять:

| Тип файла | Назначение | Пример |
| --- | --- | --- |
| Файл Markdown | Основное содержимое документации | `docs/admin-manual/xxx.md` |
| Файл бокового меню | Задаёт структуру разделов | `sidebars.ts` / `version-4.x-sidebars.json` |
| Файл перевода | Задаёт отображение категорий в документации на китайском языке | `current.json` / `version-4.x.json` |

:::caution Примечание

Вся документация должна иметь версии на китайском и английском языках. Иначе структура каталогов становится несогласованной, а документация на китайском языке может не отображаться. Это правило распространяется на всё содержимое блога, документации и раздела сообщества.

:::

### Версия Dev: актуальная документация ветки Master {#dev-version-latest-master-branch-documentation}

**1. Где изменять содержимое**

- Документация на английском языке: в `docs/` в корне репозитория
- Документация на китайском языке: в `i18n/zh-CN/docusaurus-plugin-content-docs/current/`

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

**2. Структура разделов документации**

В версии Dev структура документации на китайском и английском языках задаётся файлом `sidebars.ts` в корне репозитория.

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

**3. Перевод названий категорий на китайский язык**

Файл перевода названий категорий версии Dev на китайский язык находится по пути `i18n/zh-CN/docusaurus-plugin-content-docs/current.json`.

Рассмотрим категорию «Начало работы»:

- `sidebar.docs.category.Getting Started` соответствует иерархии `label` в `sidebars.ts`.
- Формат: `sidebar` + `.` + `docs` + `.` + `[type]` + `.` + `[label]`.

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

### Выпущенные версии 4.x / 3.x / 2.1 {#4x--3x--21-released-versions}

**1. Где изменять содержимое**

Выпущенные версии, опубликованные на сайте, перечислены в файле `versions.json` в корне репозитория. В настоящее время это 4.x, 3.x и 2.1. Каталоги `version-1.2` и `version-2.0` по-прежнему существуют в репозитории, но они не указаны в `versions.json` и не включаются в сборку сайта.

| Версия | Расположение документации на английском языке | Расположение документации на китайском языке |
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

**2. Структура разделов документации**

Для каждой версии структура документации на китайском и английском языках задаётся файлом `version-X.X-sidebars.json` в каталоге `versioned_sidebars/`, расположенном в корне репозитория.

```plain
.
├── versioned_sidebars
│   ├── version-2.1-sidebars.json
│   ├── version-3.x-sidebars.json
│   └── version-4.x-sidebars.json
```

Файлы бокового меню для отдельных версий имеют формат JSON, но используют ту же структуру, что и `sidebars.ts`. Иерархия бокового меню каждой версии изменяется практически так же, как и в версии Dev, поэтому пример здесь не приводится.

**3. Перевод названий категорий на китайский язык**

Файлы перевода названий категорий каждой версии на китайский язык находятся по пути `i18n/zh-CN/docusaurus-plugin-content-docs/version-X.X.json`.

```plain
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── version-2.1.json
│       │   ├── version-3.x.json
│       │   ├── version-4.x.json
```

Перевод `label` для документации каждой версии на китайском языке выполняется практически так же, как и для версии Dev, поэтому пример здесь не приводится.

## Каталог документации сообщества {#community-documentation-directory}

Документация сообщества сейчас представлена одной общей версией без разделения по выпускам.

| Элемент | Расположение |
| --- | --- |
| Документация на английском языке | `community/` |
| Документация на китайском языке | `i18n/zh-CN/docusaurus-plugin-content-docs-community/` |
| Структура разделов | `sidebarsCommunity.json` |
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
    - Текстовое описание: подберите его в соответствии с содержимым изображения. Рекомендуется, чтобы описание было близко к тексту заголовка раздела, в котором размещено изображение.
    - Имя изображения: если имя файла состоит из нескольких английских слов, разделяйте их дефисом `-`.

## Как писать справочник команд {#how-to-write-the-command-help-manual}

<!-- Knowledge type: Rules and conventions -->

Справочник команд представляет собой документацию в каталоге `/sql-manual` ветки Master и каждой версии документации. Эти документы используются в двух местах:

1. Для отображения в документации на официальном сайте.
2. Для вывода команды `HELP`.

Чтобы документация могла использоваться в выводе команды `HELP`, она должна строго соответствовать приведённому ниже формату. Иначе она не пройдёт проверку при приёме изменений.

Рассмотрим команду `SHOW ALTER`:

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

Как в китайской, так и в английской документации приведённые выше заголовки должны быть на английском языке, а их уровни должны строго соблюдаться.

:::

## Связанные документы {#related-documents}

- [Требования к формату документации](./docs-format-specification)
- [Как публиковать статьи в блоге](./how-to-share-blogs)
