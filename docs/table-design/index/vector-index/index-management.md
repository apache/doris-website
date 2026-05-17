---
{
    "title": "ANN Index Management",
    "language": "en",
    "description": "A complete SQL operation guide for creating, building, viewing, and dropping the Apache Doris ANN vector index, including HNSW, IVF, and quantization parameter descriptions.",
    "keywords": [
        "ANN index",
        "vector index management",
        "HNSW",
        "IVF",
        "vector similarity search",
        "Doris vector retrieval",
        "BUILD INDEX",
        "scalar quantization SQ",
        "product quantization PQ"
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

# ANN Index Management

The Approximate Nearest Neighbor (ANN) index in Apache Doris is used to perform efficient vector similarity searches on high-dimensional vector columns. Starting from Doris 4.x, the general index operation syntax covers ANN indexes. This document focuses on the SQL operation syntax and parameter descriptions related to ANN indexes.

## Quick Navigation

You can jump to the corresponding section based on your use case:

| Scenario                                              | Section                                            |
| ----------------------------------------------------- | -------------------------------------------------- |
| Create an index on a vector column for the first time | [Create an ANN Index](#create-an-ann-index)        |
| Build an index offline on existing data               | [Build an ANN Index](#build-an-ann-index)          |
| View existing indexes and their parameter settings    | [View an ANN Index](#view-an-ann-index)            |
| Drop indexes that are no longer needed                | [Drop an ANN Index](#drop-an-ann-index)            |
| Choose a specific algorithm such as HNSW, IVF, or a quantizer | [Index Parameters](#index-parameters)      |

## Prerequisites

Before creating an ANN index, confirm the following:

-   The data type of the vector column is `ARRAY<FLOAT> NOT NULL`.
-   A suitable metric type has been chosen: `l2_distance` (Euclidean distance) or `inner_product`.
-   An index algorithm (HNSW, IVF, or IVF On-Disk) has been chosen based on data scale and recall/performance requirements.

## Create an ANN Index

Doris provides two ways to create an ANN index. Choose one based on whether the data has already been loaded:

| Method                                | Applicable scenario                                                  | When the index is built                |
| ------------------------------------- | -------------------------------------------------------------------- | -------------------------------------- |
| Define the index when creating the table | The table has not been created yet, or the index needs to be built continuously as data is written | Built synchronously during data load   |
| Create and build the index separately | The table already exists with data, and the index needs to be added later | Built asynchronously via `BUILD INDEX` |

### Method 1: Define the Index When Creating the Table

Declare the ANN index directly with `INDEX ... USING ANN` after the column definitions in the `CREATE TABLE` statement. The index is built synchronously as data is loaded.

```sql
CREATE TABLE [IF NOT EXISTS] <table_name> (
    <columns_definition>
    INDEX <index_name> (<vector_column>) USING ANN PROPERTIES (
        "<key>" = "<value>" [, ...]
    )
)
...
```

### Method 2: Create the Index Separately

For an existing table, use `CREATE INDEX` or `ALTER TABLE ADD INDEX` to add an ANN index, and then use [BUILD INDEX](#build-an-ann-index) to build it on the existing data.

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

## Index Parameters

The behavior of an ANN index is determined by the attributes in `PROPERTIES`, which fall into three categories: general attributes, index-algorithm-specific attributes, and quantizer-specific attributes.

### General Attributes

The basic attributes that all ANN indexes need to configure:

| Attribute     | Description                                                                  | Default |
| ------------- | ---------------------------------------------------------------------------- | ------- |
| `index_type`  | The ANN index type. Available values: `ivf`, `ivf_on_disk`, `hnsw`           | -       |
| `metric_type` | The metric type. Available values: `l2_distance` (Euclidean distance), `inner_product` | - |
| `dim`         | The dimension of the vector column                                           | -       |
| `quantizer`   | The quantizer type. Available values: `flat`, `sq4`, `sq8`, `pq`             | `flat`  |

### Index-Algorithm-Specific Attributes

#### IVF / IVF On-Disk

| Attribute | Description                                                                                                              | Default |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | ------- |
| `nlist`   | The number of clusters (inverted lists). Required for both `ivf` and `ivf_on_disk`. A larger value yields higher recall but increases build time and resource consumption. | `1024`  |

#### HNSW

| Attribute         | Description                                                                  | Default |
| ----------------- | ---------------------------------------------------------------------------- | ------- |
| `max_degree`      | The maximum number of connections per node, which affects recall and query performance. | `32` |
| `ef_construction` | The size of the candidate queue during index construction. A larger value yields a higher-quality graph but increases build time. | `40` |

### Quantizer-Specific Attributes

`quantizer` is used to compress vector storage. The differences between quantizers are as follows:

| Quantizer | Meaning                                                                                          | Extra parameters             |
| --------- | ------------------------------------------------------------------------------------------------ | ---------------------------- |
| `flat`    | No quantization. Vectors are stored as the original 32-bit floating-point numbers.               | None                         |
| `sq4`     | Scalar Quantization. Each dimension is stored as a 4-bit integer instead of a 32-bit float.      | None                         |
| `sq8`     | Scalar Quantization. Each dimension is stored as an 8-bit integer instead of a 32-bit float.    | None                         |
| `pq`      | Product Quantization. The vector is split into several sub-vectors, which are quantized separately. | `pq_m` and `pq_nbits` are required |

#### Extra Parameters for Product Quantization (PQ)

| Attribute  | Description                                                                              |
| ---------- | ---------------------------------------------------------------------------------------- |
| `pq_m`     | The number of sub-vectors. The vector dimension `dim` must be divisible by `pq_m`.       |
| `pq_nbits` | The number of bits per sub-vector. In faiss, `pq_nbits` is typically required to be no greater than 24. |

## Index Creation Examples

The following SQL examples cover common combinations and can be used as templates.

### Declare an HNSW Index When Creating the Table

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

### IVF Index

```sql
CREATE INDEX ann_ivf_index ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024"
);
```

### HNSW Index

```sql
CREATE INDEX ann_hnsw_index ON tbl_hnsw (`embedding`) USING ANN PROPERTIES(
    "index_type"="hnsw",
    "metric_type"="l2_distance",
    "dim"="128",
    "max_degree"="32",
    "ef_construction"="40"
);
```

### HNSW + SQ

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

### HNSW + PQ

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

### IVF + SQ

```sql
CREATE INDEX ann_ivf_sq ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024",
    "quantizer"="sq8"
);
```

### IVF + PQ

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

## Build an ANN Index

For indexes that are created separately via `CREATE INDEX` or `ALTER TABLE ADD INDEX`, use `BUILD INDEX` to build them on existing data. This operation runs **asynchronously**.

### Trigger a Build

```sql
BUILD INDEX <index_name> ON <table_name> [PARTITION (<partition_name> [, ...])]
```

### Monitor Build Progress

Use `SHOW BUILD INDEX` to view the progress and status of index build tasks:

```sql
-- View the progress of all BUILD INDEX tasks (a database can be specified)
SHOW BUILD INDEX [FROM db_name];

-- View the progress of BUILD INDEX tasks for a specific table
SHOW BUILD INDEX WHERE TableName = "<table_name>";
```

The output contains columns such as `JobId`, `TableName`, `State` (for example, `FINISHED` or `RUNNING`), and `Progress`. Example:

```sql
mysql> show build index where TableName = "sift_1M";
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId         | TableName | PartitionName | AlterInvertedIndexes                                                                                                                                | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 1764579876673 | sift_1M   | sift_1M       | [ADD INDEX idx_test_ann (`embedding`) USING ANN PROPERTIES("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024")],  | 2025-12-01 17:59:54.277 | 2025-12-01 17:59:56.987 | 82            | FINISHED |      | NULL     |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
1 row in set (0.00 sec)
```

### Cancel a Build

To cancel an index build task that is in progress:

```sql
CANCEL BUILD INDEX ON <table_name> [(<job_id> [, ...])]
```

## View an ANN Index

You can view index information through `SHOW INDEX` or `SHOW CREATE TABLE`:

```sql
SHOW INDEX[ES] FROM [<db_name>.]<table_name> [FROM <db_name>]

-- Or

SHOW CREATE TABLE [<db_name>.]<table_name>
```

The output of `SHOW INDEX` includes columns such as `Table`, `Key_name`, `Index_type` (which is shown as `ANN` for ANN indexes), and `Properties` (which contains the full index configuration). Example:

```sql
mysql> SHOW INDEX FROM sift_1M;
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| Table   | Non_unique | Key_name     | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Properties                                                                             |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| sift_1M |            | idx_test_ann |              | embedding   |           |             |          |        |      | ANN        |         | ("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024") |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
```

## Drop an ANN Index

Use `DROP INDEX` or `ALTER TABLE DROP INDEX` to drop an existing ANN index:

```sql
DROP INDEX [IF EXISTS] <index_name> ON [<db_name>.]<table_name>

-- Or

ALTER TABLE [<db_name>.]<table_name> DROP INDEX <index_name>
```
