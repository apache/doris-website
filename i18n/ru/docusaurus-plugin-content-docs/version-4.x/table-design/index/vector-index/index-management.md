---
{
    "title": "Управление индексами ANN",
    "language": "ru",
    "description": "Полное руководство по операциям SQL для создания, построения, просмотра и удаления векторного индекса ANN в Apache Doris, включая описания параметров HNSW, IVF и квантования.",
    "keywords": [
        "индекс ANN",
        "управление векторными индексами",
        "HNSW",
        "IVF",
        "поиск по сходству векторов",
        "векторный поиск в Doris",
        "BUILD INDEX",
        "скалярное квантование SQ",
        "произведенческое квантование PQ"
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

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Vector retrieval table creation / Index operations / Performance tuning -->

# Управление индексами ANN {#ann-index-management}

Индекс приближённого поиска ближайших соседей (ANN) в Apache Doris позволяет эффективно выполнять поиск по сходству векторов в столбцах с векторами высокой размерности. Начиная с Doris 4.x, общий синтаксис операций с индексами распространяется и на индексы ANN. В этом документе описаны синтаксис операций SQL и параметры индексов ANN.

## Быстрый переход {#quick-navigation}

Выберите нужный раздел в зависимости от вашего сценария использования:

| Сценарий                                              | Раздел                                            |
| ----------------------------------------------------- | -------------------------------------------------- |
| Первое создание индекса для векторного столбца | [Создание индекса ANN](#create-an-ann-index)        |
| Построение индекса в автономном режиме по существующим данным | [Построение индекса ANN](#build-an-ann-index)          |
| Просмотр существующих индексов и значений их параметров | [Просмотр индекса ANN](#view-an-ann-index)            |
| Удаление индексов, которые больше не нужны | [Удаление индекса ANN](#drop-an-ann-index)            |
| Выбор конкретного алгоритма, например HNSW, IVF, или квантователя | [Параметры индекса](#index-parameters)      |

## Предварительные условия {#prerequisites}

Перед созданием индекса ANN убедитесь в следующем:

-   Векторный столбец имеет тип данных `ARRAY<FLOAT> NOT NULL`.
-   Выбран подходящий тип метрики: `l2_distance` (евклидово расстояние) или `inner_product`.
-   Выбран алгоритм индексации (HNSW, IVF или IVF On-Disk) с учётом объёма данных и требований к полноте поиска и производительности.

## Создание индекса ANN {#create-an-ann-index}

Doris предоставляет два способа создания индекса ANN. Выберите подходящий в зависимости от того, загружены ли уже данные:

| Способ                                | Когда применяется                                                  | Когда строится индекс                |
| ------------------------------------- | -------------------------------------------------------------------- | -------------------------------------- |
| Определение индекса при создании таблицы | Таблица ещё не создана или индекс должен строиться непрерывно по мере записи данных | Синхронно при загрузке данных   |
| Раздельное создание и построение индекса | Таблица уже существует и содержит данные, а индекс нужно добавить позднее | Асинхронно с помощью `BUILD INDEX` |

### Способ 1: определение индекса при создании таблицы {#method-1-define-the-index-when-creating-the-table}

Объявите индекс ANN непосредственно с помощью `INDEX ... USING ANN` после определений столбцов в операторе `CREATE TABLE`. Индекс строится синхронно по мере загрузки данных.

```sql
CREATE TABLE [IF NOT EXISTS] <table_name> (
    <columns_definition>
    INDEX <index_name> (<vector_column>) USING ANN PROPERTIES (
        "<key>" = "<value>" [, ...]
    )
)
...
```

### Способ 2: отдельное создание индекса {#method-2-create-the-index-separately}

Для существующей таблицы используйте `CREATE INDEX` или `ALTER TABLE ADD INDEX`, чтобы добавить индекс ANN, а затем [BUILD INDEX](#build-an-ann-index), чтобы построить его по существующим данным.

```sql
CREATE INDEX [IF NOT EXISTS] <index_name>
             ON <table_name> (<column_name>)
             USING ANN
             PROPERTIES ("<key>" = "<value>" [, ...])
             [COMMENT '<index_comment>']

-- Or

ALTER TABLE <table_name> ADD INDEX <index_name>(<column_name>)
             USING ANN
             [PROPERTIES ("<key>" = "<value>" [, ...])]
             [COMMENT '<index_comment>']
```

## Параметры индекса {#index-parameters}

Поведение индекса ANN определяется атрибутами в `PROPERTIES`, которые делятся на три категории: общие атрибуты, атрибуты алгоритма индексации и атрибуты квантователя.

### Общие атрибуты {#general-attributes}

Основные атрибуты, настраиваемые для всех индексов ANN:

| Атрибут     | Описание                                                                  | По умолчанию |
| ------------- | ---------------------------------------------------------------------------- | ------- |
| `index_type`  | Тип индекса ANN. Допустимые значения: `ivf`, `ivf_on_disk`, `hnsw`           | -       |
| `metric_type` | Тип метрики. Допустимые значения: `l2_distance` (евклидово расстояние), `inner_product` | - |
| `dim`         | Размерность векторного столбца                                           | -       |
| `quantizer`   | Тип квантователя. Допустимые значения: `flat`, `sq4`, `sq8`, `pq`             | `flat`  |

### Атрибуты алгоритма индексации {#index-algorithm-specific-attributes}

#### IVF / IVF On-Disk {#ivf--ivf-on-disk}

| Атрибут | Описание                                                                                                              | По умолчанию |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | ------- |
| `nlist`   | Число кластеров (инвертированных списков). Обязателен как для `ivf`, так и для `ivf_on_disk`. Большее значение повышает полноту поиска, но увеличивает время построения и потребление ресурсов. | `1024`  |

#### HNSW {#hnsw}

| Атрибут         | Описание                                                                  | По умолчанию |
| ----------------- | ---------------------------------------------------------------------------- | ------- |
| `max_degree`      | Максимальное число связей у узла, влияющее на полноту поиска и производительность запросов. | `32` |
| `ef_construction` | Размер очереди кандидатов при построении индекса. Большее значение повышает качество графа, но увеличивает время построения. | `40` |

### Атрибуты квантователя {#quantizer-specific-attributes}

`quantizer` используется для сжатия векторов при хранении. Различия между квантователями приведены ниже:

| Квантователь | Описание                                                                                          | Дополнительные параметры             |
| --------- | ------------------------------------------------------------------------------------------------ | ---------------------------- |
| `flat`    | Без квантования. Векторы хранятся как исходные 32-битные числа с плавающей точкой.               | Нет                         |
| `sq4`     | Скалярное квантование. Каждая компонента хранится как 4-битное целое число вместо 32-битного числа с плавающей точкой.      | Нет                         |
| `sq8`     | Скалярное квантование. Каждая компонента хранится как 8-битное целое число вместо 32-битного числа с плавающей точкой.    | Нет                         |
| `pq`      | Произведенческое квантование. Вектор разбивается на несколько подвекторов, которые квантуются по отдельности. | Обязательны `pq_m` и `pq_nbits` |

#### Дополнительные параметры произведенческого квантования (PQ) {#extra-parameters-for-product-quantization-pq}

| Атрибут  | Описание                                                                              |
| ---------- | ---------------------------------------------------------------------------------------- |
| `pq_m`     | Число подвекторов. Размерность вектора `dim` должна делиться на `pq_m` без остатка.       |
| `pq_nbits` | Число бит на подвектор. В faiss значение `pq_nbits` обычно не должно превышать 24. |

## Примеры создания индексов {#index-creation-examples}

Следующие примеры SQL охватывают распространённые комбинации параметров и могут использоваться как шаблоны.

### Объявление индекса HNSW при создании таблицы {#declare-an-hnsw-index-when-creating-the-table}

```sql
CREATE TABLE tbl_ann (
    id int NOT NULL,
    embedding array<float> NOT NULL,
    INDEX ann_index (embedding) USING ANN PROPERTIES(
        "index_type"="hnsw",
        "metric_type"="l2_distance",
        "dim"="128"
    )
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

### Индекс IVF {#ivf-index}

```sql
CREATE INDEX ann_ivf_index ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024"
);
```

### Индекс HNSW {#hnsw-index}

```sql
CREATE INDEX ann_hnsw_index ON tbl_hnsw (`embedding`) USING ANN PROPERTIES(
    "index_type"="hnsw",
    "metric_type"="l2_distance",
    "dim"="128",
    "max_degree"="32",
    "ef_construction"="40"
);
```

### HNSW + SQ {#hnsw--sq}

```sql
CREATE INDEX ann_hnsw_sq ON tbl_hnsw (`embedding`) USING ANN PROPERTIES(
    "index_type"="hnsw",
    "metric_type"="l2_distance",
    "dim"="128",
    "max_degree"="32",
    "ef_construction"="40",
    "quantizer"="sq8"
);
```

### HNSW + PQ {#hnsw--pq}

```sql
CREATE INDEX ann_hnsw_pq ON tbl_hnsw (`embedding`) USING ANN PROPERTIES(
    "index_type"="hnsw",
    "metric_type"="l2_distance",
    "dim"="128",
    "max_degree"="32",
    "ef_construction"="40",
    "quantizer"="pq",
    "pq_m"="8",
    "pq_nbits"="8"
);
```

### IVF + SQ {#ivf--sq}

```sql
CREATE INDEX ann_ivf_sq ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024",
    "quantizer"="sq8"
);
```

### IVF + PQ {#ivf--pq}

```sql
CREATE INDEX ann_ivf_pq ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024",
    "quantizer"="pq",
    "pq_m"="8",
    "pq_nbits"="8"
);
```

## Построение индекса ANN {#build-an-ann-index}

Для индексов, созданных отдельно с помощью `CREATE INDEX` или `ALTER TABLE ADD INDEX`, используйте `BUILD INDEX`, чтобы построить их по существующим данным. Эта операция выполняется **асинхронно**.

### Запуск построения {#trigger-a-build}

```sql
BUILD INDEX <index_name> ON <table_name> [PARTITION (<partition_name> [, ...])]
```

### Отслеживание хода построения {#monitor-build-progress}

Используйте `SHOW BUILD INDEX` для просмотра хода выполнения и состояния задач построения индексов:

```sql
-- View the progress of all BUILD INDEX tasks (a database can be specified)
SHOW BUILD INDEX [FROM db_name];

-- View the progress of BUILD INDEX tasks for a specific table
SHOW BUILD INDEX WHERE TableName = "<table_name>";
```

Результат содержит такие столбцы, как `JobId`, `TableName`, `State` (например, `FINISHED` или `RUNNING`) и `Progress`. Пример:

```sql
mysql> show build index where TableName = "sift_1M";
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId         | TableName | PartitionName | AlterInvertedIndexes                                                                                                                                | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 1764579876673 | sift_1M   | sift_1M       | [ADD INDEX idx_test_ann (`embedding`) USING ANN PROPERTIES("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024")],  | 2025-12-01 17:59:54.277 | 2025-12-01 17:59:56.987 | 82            | FINISHED |      | NULL     |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
1 row in set (0.00 sec)
```

### Отмена построения {#cancel-a-build}

Чтобы отменить выполняющуюся задачу построения индекса:

```sql
CANCEL BUILD INDEX ON <table_name> [(<job_id> [, ...])]
```

## Просмотр индекса ANN {#view-an-ann-index}

Просмотреть информацию об индексах можно с помощью `SHOW INDEX` или `SHOW CREATE TABLE`:

```sql
SHOW INDEX[ES] FROM [<db_name>.]<table_name> [FROM <db_name>]

-- Or

SHOW CREATE TABLE [<db_name>.]<table_name>
```

Результат `SHOW INDEX` включает такие столбцы, как `Table`, `Key_name`, `Index_type` (для индексов ANN отображается как `ANN`) и `Properties` (содержит полную конфигурацию индекса). Пример:

```sql
mysql> SHOW INDEX FROM sift_1M;
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| Table   | Non_unique | Key_name     | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Properties                                                                             |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| sift_1M |            | idx_test_ann |              | embedding   |           |             |          |        |      | ANN        |         | ("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024") |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
```

## Удаление индекса ANN {#drop-an-ann-index}

Используйте `DROP INDEX` или `ALTER TABLE DROP INDEX`, чтобы удалить существующий индекс ANN:

```sql
DROP INDEX [IF EXISTS] <index_name> ON [<db_name>.]<table_name>

-- Or

ALTER TABLE [<db_name>.]<table_name> DROP INDEX <index_name>
```
