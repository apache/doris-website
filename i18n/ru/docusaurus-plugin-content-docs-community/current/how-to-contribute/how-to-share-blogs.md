---
title: Как предложить статью для блога Doris
language: ru
description: "Как поделиться технической статьёй с сообществом Apache Doris: рекомендуемые темы, способы отправки и процесс публикации."
keywords:
    - Apache Doris
    - Публикация технической статьи
    - Блог Doris
    - Вклад в сообщество
    - Обмен техническими знаниями
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
<!-- Use case: Blog submission / community content contribution -->

Сообщество Doris приветствует технические статьи о Doris. После слияния статьи с репозиторием она появляется на сайте Doris. На этой странице описаны рекомендуемые темы, способы отправки статей и порядок их публикации.

## Рекомендуемые темы {#recommended-content-directions}

Статьи могут быть посвящены следующим и другим темам:

| Направление | Примеры тем |
| --- | --- |
| Советы по использованию Doris | Эффективная загрузка данных, настройка запросов, практики эксплуатации |
| Обзор возможностей Doris | Материализованные представления, инвертированные индексы, возможности lakehouse |
| Настройка системы Doris | Настройка параметров FE / BE, оптимизация JVM |
| Разбор внутреннего устройства Doris | Выполнение запросов, формат хранения, механизм компакции |
| Применение Doris в бизнес-сценариях | Анализ поведения пользователей, поиск по логам, опыт подготовки отчётов в реальном времени |

## Порядок отправки статьи {#submission-process}

<!-- Knowledge type: Procedure -->

1. Подготовьте файл статьи в формате Markdown и поместите его в каталог `/blog` репозитория [apache/doris-website](https://github.com/apache/doris-website).
2. Оформите текст в соответствии с [Правилами оформления документации](./docs-format-specification), в том числе соблюдая правила оформления блоков кода, альтернативного текста изображений и пробелов между китайскими и английскими символами.
3. Проверьте README в корне репозитория и связанные указатели, чтобы определить, нужно ли добавить запись о статье.
4. Создайте Pull Request в `apache/doris-website`, указав тему статьи и сведения об авторе.
5. Дождитесь проверки участником сообщества с правами Committer, внесите правки с учётом замечаний и выполните слияние с основной веткой.

Актуальные сведения о репозитории и порядке публикации приведены в [README репозитория apache/doris-website](https://github.com/apache/doris-website).

## Связанные документы {#related-documents}

- [Руководство по внесению вклада в документацию](./contribute-doc)
- [Правила оформления документации](./docs-format-specification)
