---
title: Построение флейм-графиков с помощью FE Profiler
language: ru
description: Используйте async-profiler для построения флейм-графиков Apache Doris FE и выявления узких мест в производительности.
keywords:
    - Apache Doris
    - FE Profiler
    - async-profiler
    - флейм-график
    - profile_fe.sh
    - узкое место в производительности FE
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

# Построение флейм-графиков с помощью FE Profiler {#generate-flame-graphs-with-fe-profiler}

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Troubleshooting -->

## Введение {#introduction}

В Apache Doris 2.1.4 и более поздних версиях в каталоге развертывания FE `${DORIS_FE_HOME}/bin` поставляется скрипт `profile_fe.sh`. Скрипт использует [async-profiler](https://github.com/async-profiler/async-profiler) для построения флейм-графика FE, который помогает выявить узкие места в производительности FE.

### Поддерживаемые системы {#system-support}

| Система | Поддерживается |
|--------|-----------|
| Linux | Да |
| macOS | Да |
| Windows | Пока нет |

## Порядок использования {#usage-steps}

### 1. Запустите profile_fe.sh {#1-run-profile_fesh}

```shell
# Profile the FE for 10 seconds by default and generate a flame graph
${DORIS_FE_HOME}/bin/profile_fe.sh

# Profile the FE for 30 seconds and generate a flame graph
PROFILE_SECONDS=30 ${DORIS_FE_HOME}/bin/profile_fe.sh
```

| Переменная окружения | Значение | По умолчанию |
|----------------------|---------|---------|
| `PROFILE_SECONDS` | Длительность сбора данных async-profiler (в секундах) | `10` |

### 2. Запустите нагрузку {#2-trigger-the-workload}

После запуска команды async-profiler собирает данные в течение указанного времени. В этот период многократно отправляйте целевые запросы в FE, чтобы async-profiler мог зафиксировать кадры стека для нужных путей выполнения кода.

### 3. Просмотрите флейм-график {#3-view-the-flame-graph}

После завершения сбора данных скрипт создает HTML-файл с флейм-графиком в каталоге `${DORIS_FE_HOME}/log`. Узкие места в производительности FE обычно выглядят как «плато» (низкие и широкие участки). Оптимизируйте код, соответствующий этим кадрам стека.

Пример флейм-графика:

![](/images/fe-profiler.png)

## Использование async-profiler в старых версиях FE {#using-async-profiler-on-older-fe-versions}

Для версий Doris, предшествующих 2.1.4, вручную скачайте следующие два файла:

1. Скачайте [ap-loader-all-3.0-8.jar](https://repo1.maven.org/maven2/me/bechberger/ap-loader-all/3.0-8/ap-loader-all-3.0-8.jar) в каталог `${DORIS_FE_HOME}/lib`.
2. Скачайте [profile_fe.sh](https://raw.githubusercontent.com/apache/doris/master/bin/profile_fe.sh) в каталог `${DORIS_FE_HOME}/bin`.
3. Запустите `profile_fe.sh`, чтобы построить флейм-график.

## Часто задаваемые вопросы {#faq}

**Вопрос: На флейм-графике нет кадров стека целевой функции за период сбора данных.**

Обычно это означает, что во время сбора данных не выполнялся соответствующий путь обработки запроса. Пока работает `profile_fe.sh`, многократно отправляйте целевой SQL вручную или с помощью скрипта либо увеличьте длительность сбора данных с помощью `PROFILE_SECONDS=30`.

**Вопрос: Как выбрать между FE Profiler и [Arthas](./arthas)?**

- `profile_fe.sh`: подход на основе скрипта с фиксированной длительностью сбора данных, подходящий для быстрого разового построения флейм-графика.
- Arthas: интерактивный терминал, поддерживающий `trace`, `watch` и другие средства более подробного наблюдения за работой программы во время выполнения; подходит для углубленного анализа.
