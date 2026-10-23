---
{
    "title": "Практическое руководство по векторному индексу",
    "sidebar_label": "Практическое руководство",
    "language": "ru",
    "description": "Практическое руководство по векторному индексу (ANN) Apache Doris: полный рабочий процесс, охватывающий создание таблиц и индексов, загрузку данных, выполнение запросов, настройку и устранение неполадок.",
    "keywords": [
        "векторный индекс Doris",
        "индекс ANN",
        "HNSW",
        "IVF",
        "поиск по векторам",
        "векторный поиск",
        "семантический поиск",
        "RAG",
        "косинусное сходство",
        "полнота векторного поиска",
        "BUILD INDEX"
    ]
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

<!-- Knowledge type: Operational guide / End-to-end workflow -->
<!-- Applicable scenarios: Launching vector retrieval / Performance tuning / Troubleshooting -->

Этот документ предназначен для пользователей, которым нужно развернуть векторный поиск (ANN) в Apache Doris. В нём описан полный рабочий процесс от проектирования таблиц до настройки запросов и устранения неполадок. Если вы рассматриваете перенос семантического поиска, RAG или отбора кандидатов для рекомендательных систем в Doris, вы можете следовать шагам, приведённым в этом документе.

## Быстрая навигация {#quick-navigation}

| Что вы хотите сделать | Раздел |
|---|---|
| Проверить, соответствуют ли версия Doris и модель таблицы требованиям | [Предварительные требования и ограничения](#prerequisites-and-limitations) |
| Выбрать между индексами HNSW и IVF | [Сценарии использования и выбор индекса](#applicable-scenarios-and-index-selection) |
| Пройти весь процесс: создание таблицы -> загрузка данных -> выполнение запросов | [Полный рабочий процесс](#end-to-end-operational-workflow) |
| Выполнить сортировку по косинусному сходству | [Использование косинусного сходства](#using-cosine-similarity) |
| Повысить полноту поиска / снизить задержку | [Настройка запросов и построения индекса](#query-and-build-tuning) |
| Устранить проблемы с использованием индекса, низкой полнотой поиска или сбоями загрузки данных | [Типичные неполадки и их устранение](#common-troubleshooting) |

---

## Сценарии использования и выбор индекса {#applicable-scenarios-and-index-selection}

<!-- Knowledge type: Architectural selection decision -->

Начиная с Apache Doris 4.x поддерживаются векторные индексы ANN (Approximate Nearest Neighbor). Типичные сценарии использования:

- Семантический поиск
- Поиск для дополнения контекста в RAG
- Отбор кандидатов в рекомендательных системах
- Поиск изображений или мультимодальный поиск
- Обнаружение аномалий

### Сравнение типов индексов {#index-type-comparison}

| Тип индекса | Полнота поиска | Производительность запросов в реальном времени | Скорость построения | Использование памяти | Сценарий использования |
|---|---|---|---|---|---|
| `hnsw` | Высокая | Хорошая | Низкая | Повышенное | Поиск в реальном времени с низкой задержкой |
| `ivf` | Средняя | Более высокая | Высокая | Более экономное | Большие наборы данных |
| `ivf_on_disk` | Средняя | Средняя | Высокая | Наиболее экономное | Очень большие объёмы данных при ограниченной памяти |

### Поддерживаемые функции расстояния {#supported-distance-functions}

| Функция | Направление сортировки | Описание |
|---|---|---|
| `l2_distance_approximate` | `ORDER BY ... ASC` | Евклидово расстояние: чем меньше расстояние, тем выше сходство |
| `inner_product_approximate` | `ORDER BY ... DESC` | Скалярное произведение: чем больше значение, тем выше сходство |

> Косинусное сходство нельзя настроить напрямую через `metric_type="cosine"`. Для его реализации нужно нормализовать векторы и использовать скалярное произведение. Подробнее см. в разделе [Использование косинусного сходства](#using-cosine-similarity).

---

## Предварительные требования и ограничения {#prerequisites-and-limitations}

<!-- Knowledge type: Environment requirements -->
<!-- Applicable scenarios: Pre-deployment check -->

Перед использованием индексов ANN проверьте следующие условия:

| Что проверить | Требование |
|---|---|
| Версия Doris | `>= 4.0.0` |
| Модель таблицы | `DUPLICATE KEY`; для `UNIQUE KEY` необходимо включить merge-on-write (поддерживается с версии 4.1.4) |
| Тип векторного столбца | `ARRAY<FLOAT> NOT NULL` |
| Согласованность размерностей | Размерность загружаемых векторов должна совпадать с параметром индекса `dim` |

Минимальный пример создания таблицы:

```sql
CREATE TABLE document_vectors (
    id BIGINT NOT NULL,
    embedding ARRAY<FLOAT> NOT NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

---

## Полный рабочий процесс {#end-to-end-operational-workflow}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: First-time deployment of vector retrieval -->

Полный рабочий процесс состоит из 4 шагов: создание таблицы -> настройка индекса -> загрузка данных -> построение индекса и отслеживание его состояния.

### Шаг 1: Создание таблицы с векторами {#step-1-create-the-vector-table}

Таблицу можно создать двумя способами. Выбор зависит от объёма данных и режима загрузки:

| Способ | Преимущества | Недостатки | Рекомендуемый сценарий |
|---|---|---|---|
| Определить индекс ANN непосредственно при создании таблицы | Данные доступны для запросов сразу после записи | Более медленная загрузка данных | Небольшие объёмы, потоковая загрузка |
| Сначала создать таблицу и загрузить данные, затем выполнить `CREATE INDEX` + `BUILD INDEX` | Более быстрая загрузка данных, возможность выбрать время построения | Требуется дополнительный шаг построения | Пакетная загрузка больших объёмов данных |

Пример определения индекса ANN непосредственно при создании таблицы:

```sql
CREATE TABLE document_vectors (
    id BIGINT NOT NULL,
    title VARCHAR(500),
    content TEXT,
    category VARCHAR(100),
    embedding ARRAY<FLOAT> NOT NULL,
    INDEX idx_embedding (embedding) USING ANN PROPERTIES (
        "index_type" = "hnsw",
        "metric_type" = "l2_distance",
        "dim" = "768"
    )
)
ENGINE = OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

### Шаг 2: Настройка параметров векторного индекса {#step-2-configure-vector-index-parameters}

<!-- Knowledge type: Configuration parameters -->

Общие параметры:

| Параметр | Значения | Описание |
|---|---|---|
| `index_type` | `hnsw` / `ivf` / `ivf_on_disk` | Тип индекса |
| `metric_type` | `l2_distance` / `inner_product` | Метрика расстояния |
| `dim` | Целое число | Размерность вектора |
| `quantizer` | `flat` / `sq8` / `sq4` / `pq` | Метод квантования (необязательно) |

Параметры HNSW:

| Параметр | Значение по умолчанию | Описание |
|---|---|---|
| `max_degree` | `32` | Максимальное число соседей у узла |
| `ef_construction` | `40` | Ширина поиска при построении |

Параметры IVF (общие для `ivf` и `ivf_on_disk`):

| Параметр | Значение по умолчанию | Описание |
|---|---|---|
| `nlist` | `1024` | Число центроидов кластеров |

Пример создания индекса после создания таблицы:

```sql
CREATE INDEX idx_embedding ON document_vectors (embedding) USING ANN PROPERTIES (
    "index_type" = "hnsw",
    "metric_type" = "l2_distance",
    "dim" = "768",
    "max_degree" = "64",
    "ef_construction" = "128"
);
```

### Шаг 3: Загрузка данных {#step-3-ingest-data}

Рекомендуемый порядок пакетной загрузки:

1. Создайте таблицу, **пока не выполняя построение индекса**
2. Загрузите данные пакетами (Stream Load / S3 TVF / SDK)
3. Постройте индекс после завершения загрузки всех данных

В производственных средах предпочтителен этот пакетный режим. Он позволяет существенно сократить время загрузки данных.

### Шаг 4: Построение индекса и отслеживание его состояния {#step-4-build-the-index-and-monitor}

Если индекс создаётся после загрузки данных, его построение нужно запустить вручную:

```sql
BUILD INDEX idx_embedding ON document_vectors;

SHOW BUILD INDEX WHERE TableName = "document_vectors";
```

Состояния построения: `PENDING`, `RUNNING`, `FINISHED`, `CANCELLED`.

---

## Шаблоны запросов {#query-patterns}

<!-- Knowledge type: Operational examples -->

### Поиск ближайших соседей TopN {#topn-nearest-neighbor-search}

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
ORDER BY dist
LIMIT 10;
```

### Поиск в заданном диапазоне {#range-search}

```sql
SELECT id, title
FROM document_vectors
WHERE l2_distance_approximate(embedding, [0.1, 0.2, ...]) < 0.5;
```

### Гибридный поиск с условиями фильтрации {#hybrid-search-with-filter-conditions}

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
WHERE category = 'AI'
ORDER BY dist
LIMIT 10;
```

В сценариях гибридной фильтрации Doris использует стратегию **предварительной фильтрации**, которая обеспечивает баланс между производительностью и полнотой поиска.

---

## Использование косинусного сходства {#using-cosine-similarity}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Business metric is cosine -->

Индексы ANN не поддерживают прямую настройку `metric_type="cosine"`. Если для вашей задачи нужна сортировка по косинусному сходству, используйте следующий подход:

1. Выполните L2-нормализацию векторов перед загрузкой данных (преобразуйте их в единичные векторы)
2. При создании индекса ANN используйте `metric_type="inner_product"`
3. В запросах используйте `inner_product_approximate(...)` и сортируйте с помощью `ORDER BY ... DESC`

**Принцип:**

- `cos(x, y) = (x · y) / (||x|| · ||y||)`
- После нормализации `||x|| = ||y|| = 1`, поэтому `cos(x, y) = x · y`

В пространстве единичных векторов сортировка по косинусному сходству эквивалентна сортировке по скалярному произведению.

---

## Настройка запросов и построения индекса {#query-and-build-tuning}

<!-- Knowledge type: Performance tuning -->
<!-- Applicable scenarios: Recall not meeting requirements / Latency too high -->

### Параметры запросов {#query-parameters}

| Тип индекса | Параметр настройки | Влияние |
|---|---|---|
| HNSW | `hnsw_ef_search` | Чем больше значение, тем выше полнота поиска и задержка |
| IVF | `nprobe` или `ivf_nprobe` (в зависимости от версии) | Чем больше значение, тем выше полнота поиска |

```sql
SET hnsw_ef_search = 100;
SET nprobe = 128;
SET optimize_index_scan_parallelism = true;
```

### Рекомендации по построению {#build-recommendations}

1. Для больших объёмов данных сначала выполните компактацию, затем запустите окончательное построение индекса
2. Контролируйте размер сегментов: слишком большие сегменты могут снижать полноту поиска
3. Проводите сравнительные тесты A/B с несколькими наборами параметров на одном и том же наборе данных

### Оценка потребности в ресурсах {#capacity-estimation}

- Приблизительная формула потребления памяти векторами: `dim * 4 bytes * row_count`
- Добавьте к этому расходы на структуру индекса ANN
- Зарезервируйте память для невекторных столбцов и операторов выполнения запросов

Ориентиры по потребности в ресурсах при масштабе 10M / 100M для развёртываний на одном узле и в распределённой среде см. в разделе [Тест производительности на больших объёмах данных](./performance-large-scale.md).

---

## Управление индексами {#index-management}

<!-- Knowledge type: Operational commands -->

Основные команды SQL для управления:

```sql
-- View the index list
SHOW INDEX FROM document_vectors;

-- View data scale
SHOW DATA ALL FROM document_vectors;

-- Drop the index
ALTER TABLE document_vectors DROP INDEX idx_embedding;
```

Для изменения параметров индекса рекомендуется **удалить старый индекс и построить его заново**.

---

## Типичные неполадки и их устранение {#common-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting -->

### Индекс не используется {#index-not-taking-effect}

Выполните проверки в следующем порядке:

1. Существует ли индекс: выполните `SHOW INDEX`
2. Завершено ли построение индекса: выполните `SHOW BUILD INDEX`
3. Используется ли в запросе функция расстояния с суффиксом `_approximate`

### Низкая полнота поиска {#low-recall}

| Что проверить | Рекомендация |
|---|---|
| Параметры HNSW | Увеличьте `max_degree`, `ef_construction`, `hnsw_ef_search` |
| Параметры поиска IVF | Увеличьте `nprobe` / `ivf_nprobe` |
| Размер сегментов | Перестройте индекс после компактации |

### Высокая задержка запросов {#high-query-latency}

| Что проверить | Рекомендация |
|---|---|
| Холодные и прогретые запросы | Время загрузки индекса различается. После запуска сервиса можно выполнить прогрев |
| Слишком большое значение `hnsw_ef_search` | Уменьшите его до подходящего уровня, чтобы снизить задержку |
| Параллельное сканирование не включено | Установите `optimize_index_scan_parallelism = true` |
| Нехватка памяти BE | Проверьте использование памяти BE и работу GC |

### Сбой загрузки данных {#ingestion-failure}

| Типичная причина | Рекомендация |
|---|---|
| Несоответствие размерностей | Проверьте, совпадает ли размерность загружаемых векторов с параметром индекса `dim` |
| В векторном столбце встречается NULL | На стороне приложения замените NULL или отфильтруйте такие значения |
| Неверный формат массива вектора | Проверьте формат данных JSON / Stream Load |

---

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Frequently asked questions -->

**Вопрос 1: Можно ли использовать индексы ANN в таблицах UNIQUE KEY или AGGREGATE KEY?**

Начиная с версии 4.1.4 индексы ANN поддерживают модель **DUPLICATE KEY** и модель **UNIQUE KEY** с включённым **merge-on-write** (`enable_unique_key_merge_on_write = "true"`). Таблицы UNIQUE KEY с merge-on-read и таблицы AGGREGATE KEY по-прежнему не поддерживаются. Версии до 4.1.4 поддерживают только модель DUPLICATE KEY.

**Вопрос 2: Можно ли одновременно создавать индексы ANN и инвертированные индексы?**

Да. В одной таблице можно создать как индекс ANN, так и инвертированный индекс. Сочетание текстовой фильтрации с векторной сортировкой позволяет реализовать **гибридный поиск**, который часто используется в RAG в реальном времени.

**Вопрос 3: Что делать, если нужно использовать косинусное сходство?**

ANN не поддерживает `metric_type="cosine"`. Нормализуйте векторы и используйте `inner_product`: результат будет эквивалентным. Подробнее см. в разделе [Использование косинусного сходства](#using-cosine-similarity).

**Вопрос 4: Что делать, если BUILD INDEX завис в состоянии RUNNING?**

Проверьте ход выполнения с помощью `SHOW BUILD INDEX`. Построение индекса для большой таблицы само по себе занимает много времени, поэтому сначала убедитесь, что процесс продолжается в штатном режиме. Если прогресса нет длительное время, проверьте состояние памяти и дисков BE.

**Вопрос 5: Как изменить параметры индекса ANN?**

Параметры индекса ANN нельзя изменить на месте. Рекомендуется **сначала выполнить DROP INDEX, затем CREATE INDEX с новыми параметрами**, а в завершение BUILD INDEX.
