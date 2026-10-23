---
title: Pipeline Tracing
language: ru
description: Инструмент Pipeline Tracing в Apache Doris записывает трассировки планирования и визуализирует их с помощью Perfetto.
keywords:
    - Apache Doris
    - Pipeline Tracing
    - Движок выполнения Pipeline
    - Perfetto
    - Анализ планирования
    - Настройка производительности BE
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

# Pipeline Tracing {#pipeline-tracing}

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Scheduling analysis -->

## Введение {#introduction}

В движке выполнения Pipeline в Apache Doris дерево плана выполнения каждого Instance разбивается на несколько Pipeline Tasks, которые планируются и выполняются собственным планировщиком Pipeline. При большом количестве Pipeline Tasks распределение этих Tasks по потокам и ядрам CPU становится важным фактором, влияющим на производительность выполнения.

Инструмент Pipeline Tracing позволяет наблюдать за процессом планирования для конкретного запроса или за определённый период времени, упрощая анализ производительности и поиск узких мест.

## Порядок использования {#usage-steps}

### 1. Запись данных планирования {#1-record-scheduling-data}

Используйте HTTP-интерфейсы, чтобы включать и отключать запись процесса планирования на BE и настраивать её режим. Эти настройки действуют только на выбранный BE.

| Назначение | HTTP-команда |
|---------|----------|
| Отключить запись Pipeline Tracing | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=disable` |
| Создавать отдельную запись для каждого запроса | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=perquery` |
| Создавать запись трассировки за фиксированный период | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=periodic` |
| Задать длительность периода (в секундах) | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?dump_interval=60` |

Примеры команд:

```shell
# Disable Pipeline Tracing recording
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=disable

# Produce one record per query
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=perquery

# Produce a tracing record over a fixed period
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=periodic

# Set the period length to 60 seconds
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?dump_interval=60
```

### 2. Преобразование формата данных {#2-convert-the-data-format}

Записанные данные сохраняются в каталоге `log/tracing` соответствующего BE. Используйте скрипт преобразования из `doris/tools/pipeline-tracing/`, чтобы преобразовать исходные данные в формат JSON, который может загрузить Perfetto:

```shell
cd doris/tools/pipeline-tracing/
python3 origin-to-show.py -s <SOURCE_FILE> -d <DEST>.json
```

Параметры:

| Параметр | Значение |
|------|------|
| `-s <SOURCE_FILE>` | Путь к исходному файлу трассировки, созданному BE |
| `-d <DEST>.json` | Путь к выходному файлу JSON для визуализации |

Более подробные инструкции см. в файле `README.md` в этом каталоге.

### 3. Визуализация в Perfetto {#3-visualize-in-perfetto}

1. Откройте [Perfetto](https://ui.perfetto.dev/).
2. Нажмите `Open trace file` и выберите файл JSON, созданный на предыдущем шаге.
3. Просмотрите результат планирования:

    ![](/images/tracing1.png)

    Perfetto также позволяет увидеть, как одна и та же Task планируется на разных ядрах CPU:

    ![](/images/tracing2.png)

## Часто задаваемые вопросы {#faq}

**В: Где находятся файлы трассировки?**

Они находятся в каталоге `log/tracing` соответствующего BE. Имя файла содержит временную метку и информацию о запросе.

**В: Влияет ли включение Pipeline Tracing на производительность?**

Запись трассировки создаёт некоторые накладные расходы. Включайте её только на время анализа планирования и отключайте с помощью `type=disable` после завершения анализа.
