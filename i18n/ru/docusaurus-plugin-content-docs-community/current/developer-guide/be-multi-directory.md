---
title: Общий кэш BE для нескольких каталогов
language: ru
description: Руководство по настройке и отладке общего кэша ccache при разработке Apache Doris BE в нескольких каталогах (worktree).
keywords:
    - Apache Doris BE
    - ccache
    - git worktree
    - multi-directory development
    - CCACHE_BASEDIR
    - ffile-prefix-map
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

# Общий кэш BE для нескольких каталогов {#be-multi-directory-shared-cache}

При разработке Doris BE с помощью ИИ-агента часто приходится одновременно работать с несколькими ветками разработки в разных каталогах, используя `git worktree` или аналогичные подходы. Поскольку кэширование в ccache зависит от полных путей к файлам, ccache не может использовать кэш в разных каталогах, даже если содержимое cpp-файлов почти идентично. В результате код в каталоге worktree приходится компилировать с нуля, что значительно замедляет разработку. Для решения этой проблемы реализованы специальные оптимизации. Выполните настройку, как описано ниже.

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Multi-worktree parallel development / Build acceleration -->

## 1. Требования к каталогам {#1-directory-requirements}

Doris уже задаёт `CCACHE_BASEDIR` и `-ffile-prefix-map` в файле конфигурации окружения, приводя пути в большинстве параметров компиляции к одному и тому же виду, чтобы обеспечить попадания в кэш. **Обязательное условие: все каталоги разработки Doris должны находиться в одном родительском каталоге.** То есть все каталоги разработки Doris должны располагаться на одном уровне, как в следующем примере:

```bash
xxx/doris_main
xxx/doris1
xxx/doris2
```

## 2. Настройка окружения {#2-environment-configuration}

<!-- Knowledge type: Operation steps -->

### 2.1 Настройка жёстко заданного пути UBSAN_IGNORELIST {#21-configure-the-ubsan_ignorelist-hardcoded-path}

Помимо автоматических настроек, описанных выше, необходимо вручную скорректировать жёстко заданный путь. В файле `custom_env.sh` каталога worktree явно задайте путь к UBSAN IGNORELIST основного репозитория:

```bash
export UBSAN_IGNORELIST=${DORIS_MAIN_REPO}/conf/ubsan_ignorelist.txt
```

Здесь `DORIS_MAIN_REPO` обозначает путь к основному репозиторию. Рекомендуемый порядок действий:

1. Задайте это значение непосредственно в файле `custom_env.sh` основного репозитория.
2. Используйте `hooks/setup_worktree.sh` совместно с `AGENTS.md`, чтобы рабочий процесс с ИИ автоматически переносил это значение во все каталоги worktree.

### 2.2 Увеличение размера кэша ccache {#22-increase-the-ccache-cache-capacity}

Чтобы обеспечить достаточно места для кэша, вручную увеличьте максимальный размер кэша ccache:

```bash
ccache --set-config=max_size=50G
```

| Параметр | Рекомендуемое значение | Описание                                                  |
| ------------- | ----------------- | ------------------------------------------------------------ |
| `max_size`    | `50G`             | Минимальный рекомендуемый размер при одновременной работе с несколькими worktree |

## 3. Методы отладки {#3-debugging-methods}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Troubleshooting / Cache miss diagnosis -->

### 3.1 Просмотр статистики кэша {#31-view-cache-statistics}

Выполните `ccache -s`, чтобы просмотреть статистику кэша и проверить, работает ли он. Обратите внимание на поле `cache hit rate`. Если значение слишком низкое, попадания в кэш происходят некорректно. Перед каждой проверкой выполняйте `ccache -z`, чтобы сбросить статистику и получить точный результат.

| Команда      | Назначение                                  |
| ------------ | ---------------------------------------- |
| `ccache -s`  | Просмотр статистики попаданий в кэш                |
| `ccache -z`  | Сброс статистики (без очистки кэша)  |
| `ccache -C`  | Очистка кэша (используйте с осторожностью)       |

### 3.2 Включение отладочного журналирования ccache {#32-enable-ccache-debug-logging}

Убедившись, что есть проблема с попаданиями в кэш, включите отладочное журналирование ccache:

```bash
export CCACHE_LOGFILE=/path/to/xxx
export CCACHE_DEBUG=1
```

| Переменная окружения | Действие                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------- |
| `CCACHE_LOGFILE`     | Файл подробного журнала, позволяющий выяснить причину каждого попадания в кэш или промаха        |
| `CCACHE_DEBUG=1`     | Создаёт для каждой единицы компиляции файл `*.ccache-input-text`, в котором записываются её входные данные |

### 3.3 Выявление причины промаха {#33-identify-the-cause-of-a-miss}

После включения `CCACHE_DEBUG=1` для каждой единицы компиляции создаётся отдельный файл `*.ccache-input-text`, в котором записываются её входные данные, включая путь к исходному файлу, параметры компиляции и так далее.

Теоретически для одного и того же файла в двух разных каталогах **содержимое соответствующих файлов `ccache-input-text` должно полностью совпадать, чтобы произошло попадание в кэш ccache.** Если для файла происходит промах, сравните файлы `ccache-input-text` с обеих сторон, чтобы выявить его причину.

## 4. Часто задаваемые вопросы (FAQ) {#4-frequently-asked-questions-faq}

<!-- Knowledge type: Troubleshooting -->

### Q1: Коэффициент попаданий в кэш всегда равен 0 {#q1-the-cache-hit-rate-is-always-0}

Проверьте, находятся ли все worktree в одном родительском каталоге. В противном случае `CCACHE_BASEDIR` и `-ffile-prefix-map` не смогут привести пути к единому виду и попаданий в кэш не будет.

### Q2: Содержимое кэша часто вытесняется {#q2-cache-space-is-evicted-frequently}

Увеличьте `max_size`, как описано в разделе 2.2. При одновременной работе с несколькими worktree рекомендуется не менее 50 GB.

### Q3: Путь UBSAN_IGNORELIST вызывает ошибку {#q3-the-ubsan_ignorelist-path-reports-an-error}

В каталоге worktree через `custom_env.sh` не задан путь к файлу ignorelist основного репозитория. Инструкции по настройке см. в разделе 2.1.
