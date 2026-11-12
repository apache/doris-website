---
title: Правила нумерации и выбор версии Apache Doris
language: ru
description: Правила нумерации версий Apache Doris (major/minor/patch), политика совместимости при обновлении и откате версий, а также руководство по выбору бинарного файла в зависимости от CPU.
keywords:
    - Номер версии Apache Doris
    - Правила версионирования Doris
    - Обновление и откат версий Doris
    - Версии Latest и Stable
    - x64 avx2 ARM64
    - Выбор бинарного файла Doris
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

# Правила нумерации и выбор версии Apache Doris {#apache-doris-version-rules-and-version-selection}

<!-- Knowledge type: Rule specification -->
<!-- Applicable scenarios: Version selection / Upgrade and downgrade evaluation / Pre-deployment check -->

В этом документе описаны значение номеров версий Apache Doris, политика совместимости при обновлении и откате версий, а также выбор подходящего бинарного файла в зависимости от архитектуры CPU.

## Правила нумерации версий {#version-number-rules}

Apache Doris использует номер версии из трёх частей: `X.Y.Z`. Значение каждой части, типичные изменения и периодичность выпуска приведены ниже:

| Позиция | Название | Значение | Периодичность выпуска |
| --- | --- | --- | --- |
| X | Major | Выпуск с крупными новыми функциями или обновлением архитектуры | Ежегодно |
| Y | Minor | Важные новые функции, оптимизация производительности или необходимые изменения формата метаданных или данных | Ежеквартально |
| Z | Patch | Исправления ошибок, оптимизация производительности и небольшие функциональные обновления | Обычно каждые 2-4 недели |

## Обновление и откат версий {#version-upgrade-and-downgrade}

<!-- Knowledge type: Rule specification -->

| Тип обновления | Прямая совместимость (старая → новая) | Обратная совместимость (новая → старая) | Рекомендация |
| --- | --- | --- | --- |
| Major (X) | Совместимо | Не гарантируется | Создайте резервную копию данных перед обновлением |
| Minor (Y) | Совместимо | Не гарантируется | Создайте резервную копию данных перед обновлением |
| Patch (Z) | Совместимо | Совместимо | Обновляйте и откатывайте версии напрямую, без проблем с совместимостью данных |

Обновления версий Major (X) и Minor (Y) могут включать изменения формата метаданных или данных. Apache Doris гарантирует прямую совместимость этих изменений (то есть возможность обновления со старой версии до новой), но не гарантирует обратную совместимость (то есть возможность отката с новой версии на старую не гарантируется). Версии Patch (Z) поддерживают как обновление, так и откат.

## Как выбрать версию {#how-to-select-a-version}

Команда Apache Doris в основном поддерживает две последние ветки версий, обозначенные как **Latest** и **Stable**:

| Обозначение | Содержание | Сценарии использования |
| --- | --- | --- |
| Latest | Новейшие функции, оптимизации и исправления ошибок | Опробование новых функций, проверка POC, тестирование производительности, предпродуктивная среда |
| Stable | Постоянное исправление ошибок, более высокая стабильность | Продуктивная среда |

## Модели CPU и варианты бинарных файлов {#cpu-models-and-binary-versions}

<!-- Knowledge type: Hardware requirement -->
<!-- Applicable scenarios: Pre-deployment check / Environment acceptance -->

Apache Doris предоставляет три варианта бинарных файлов для разных архитектур CPU и наборов инструкций:

| Название бинарного файла | Подходящие CPU | Описание |
| --- | --- | --- |
| x64(avx2) | CPU x86_64 с поддержкой набора инструкций AVX2 | Рекомендуется по умолчанию, наилучшая производительность |
| x64(no avx2) | CPU x86_64 без поддержки набора инструкций AVX2 | Для более старых процессоров x86_64 |
| ARM64 | CPU на базе ARM | Для серверов ARM (например, Kunpeng, Graviton) |

:::tip Совет
Выполните следующую команду, чтобы проверить, поддерживает ли CPU набор инструкций AVX2:

```bash
cat /proc/cpuinfo | grep avx2
```

Если команда выводит результат, CPU поддерживает AVX2 и можно выбрать бинарный файл `x64(avx2)`.
:::

## Часто задаваемые вопросы {#faq}

**Вопрос: Можно ли напрямую откатиться с 2.0.x на 1.2.x?**

Нет. При откате между версиями Major или Minor совместимость форматов метаданных и данных не гарантируется. Перед любым обновлением версии Major или Minor выполняйте полное резервное копирование.

**Вопрос: Можно ли обновлять версии Patch, пропуская промежуточные версии (например, с 2.0.1 сразу до 2.0.5)?**

Да. Версии Patch сохраняют прямую и обратную совместимость, поэтому при обновлении или откате можно пропускать промежуточные версии.

**Вопрос: Как выбрать между Latest и Stable?**

Для продуктивной среды в первую очередь выбирайте Stable. Для оценки возможностей и опробования новых функций выбирайте Latest.
