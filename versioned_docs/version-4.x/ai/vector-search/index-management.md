---
{
    "title": "ANN Index Management",
    "language": "en",
    "description": "Approximate Nearest Neighbor (ANN) indexes in Apache Doris enable efficient vector similarity search for high-dimensional data. Since from Doris 4.x,"
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



# ANN Index Management

## Overview

Approximate Nearest Neighbor (ANN) indexes in Apache Doris enable efficient vector similarity search for high-dimensional data. Since from Doris 4.x, the universal index operation syntax has also been extended to cover ANN indexes. This article will introduce the specific SQL syntax for ANN index-related operations and provide detailed parameter explanations.

ANN indexes are built on vector columns (typically `ARRAY<FLOAT> NOT NULL` type) and support distance metrics include L2 distance and inner product.

## Creating ANN Indexes

ANN indexes can be created using the `CREATE INDEX` statement with `USING ANN`. There are two main approaches:

1. **Define the index during table creation**: The index is built synchronously as data is loaded.

### Syntax

```sql
CREATE TABLE [IF NOT EXISTS] <table_name> (
  <columns_definition>
  INDEX <index_name> (<vector_column) USING ANN PROPERTIES (
    "<key>" = "<value>" [, ...]
  )
)
[ <key_type> KEY (<key_cols>)
    [ CLUSTER BY (<cluster_cols>) ]
]
[ COMMENT '<table_comment>' ]
[ <partitions_definition> ]
[ DISTRIBUTED BY { HASH (<distribute_cols>) | RANDOM }
    [ BUCKETS { <bucket_count> | AUTO } ]
]
[ <roll_up_definition> ]
[ PROPERTIES (
    -- Table property
    <table_property>
    -- Additional table properties
    [ , ... ])
]
```

2. **Create the index separately**: Define the index first, then build it on existing data using `BUILD INDEX`.

### Syntax

```sql
CREATE INDEX [IF NOT EXISTS] <index_name>
             ON <table_name> (<column_name>)
             USING ANN
             PROPERTIES ("<key>" = "<value>" [, ...])
             [COMMENT '<index_comment>']

-- or
ALTER TABLE <table_name> ADD INDEX <index_name>(<column_name>)
             USING ANN
             [PROPERTIES("<key>" = "<value>" [, ...])]
             [COMMENT '<index_comment>']
```

### General Properties

- `index_type`: The type of ANN index. Supported values: `"ivf"` or `"hnsw"`.
- `metric_type`: The distance metric. Supported values: `"l2_distance"`, `"inner_product"`.
- `dim`: The dimension of the vector column.
- `quantizer`: The quantizer type. Supported values: `flat`, `sq4`, `sq8`, `pq`. Default to `flat` when not specified.

### Index-Specific Properties

#### IVF Index Properties

- `nlist`: Number of clusters (inverted lists). Default: 1024. Higher values improve recall but increase build time and memory usage.

#### HNSW Index Properties

- `max_degree`: Maximum number of connections per node. Default: 32. Affects recall and query performance.
- `ef_construction`: Size of the candidate queue during index construction. Default: 40. Higher values improve graph quality but increase build time.

### Quantization-Specific Properties

for quantizer property:

- `sq4`: Scalar Quantization (SQ), uses 4-bit integers instead of the typical 32-bit floating point numbers to store each dimension value of a vector. 
- `sq8`: Scalar Quantization (SQ), uses 8-bit integers instead of the typical 32-bit floating point numbers to store each dimension value of a vector. 
- `pq`: Product Quantization (PQ), two additional parameters, `pq_m` and `pq_nbits` are required in the properties.

#### Product Quantization Properties

- `pq_m`: Specifies how many subvectors are used (vector dimension dim must be divisible by pq_m).
- `pq_nbits`: The number of bits used to represent each subvector, in faiss pq_nbits is generally required to be no greater than 24.

### Examples

#### Create table with ANN index

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

#### IVF Index

```sql
CREATE INDEX ann_ivf_index ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024"
);
```

#### HNSW Index

```sql
CREATE INDEX ann_hnsw_index ON tbl_hnsw (`embedding`) USING ANN PROPERTIES(
    "index_type"="hnsw",
    "metric_type"="l2_distance",
    "dim"="128",
    "max_degree"="32",
    "ef_construction"="40"
);
```

#### HNSW Index with SQ

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

#### HNSW Index with PQ

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

#### IVF Index with SQ

```sql
CREATE INDEX ann_ivf_sq ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024",
    "quantizer"="sq8"
);
```

#### IVF Index with PQ

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

## Building ANN Indexes

For indexes created separately (not during table creation), use `BUILD INDEX` to build the index on existing data. This operation is asynchronous.

### Syntax

```sql
BUILD INDEX <index_name> ON <table_name> [PARTITION (<partition_name> [, ...])]
```

### Monitoring Build Progress

Use `SHOW BUILD INDEX` to check the status of index build jobs.

```sql
-- view all the progress of BUILD INDEX tasks [for a specific database]
SHOW BUILD INDEX [FROM db_name];

-- view the progress of BUILD INDEX tasks for a specific table
SHOW BUILD INDEX WHERE TableName = "<table_name>";
```

The output includes columns such as `JobId`, `TableName`, `State` (e.g., `FINISHED`, `RUNNING`), and `Progress`, for example:

```sql
mysql> show build index where TableName = "sift_1M";
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId         | TableName | PartitionName | AlterInvertedIndexes                                                                                                                                | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 1764579876673 | sift_1M   | sift_1M       | [ADD INDEX idx_test_ann (`embedding`) USING ANN PROPERTIES("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024")],  | 2025-12-01 17:59:54.277 | 2025-12-01 17:59:56.987 | 82            | FINISHED |      | NULL     |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
1 row in set (0.00 sec)
```

### Canceling Index Builds

To cancel an ongoing index build:

```sql
CANCEL BUILD INDEX ON <table_name> [(<job_id> [, ...])]
```

## Dropping ANN Indexes

Remove an ANN index using `DROP INDEX`.

### Syntax

```sql
DROP INDEX [IF EXISTS] <index_name> ON [<db_name>.]<table_name>

-- or
ALTER TABLE [<db_name>.]<table_name> DROP INDEX <index_name>
```


## Showing ANN Indexes

Display information about indexes on a table using `SHOW INDEX` or `SHOW CREATE TABLE`.

### Syntax

```sql
SHOW INDEX[ES] FROM [<db_name>.]<table_name> [FROM <db_name>]

-- or
SHOW CREATE TABLE [<db_name>.]<table_name>
```

### Example Output

```sql
mysql> SHOW INDEX FROM sift_1M;
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| Table   | Non_unique | Key_name     | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Properties                                                                             |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| sift_1M |            | idx_test_ann |              | embedding   |           |             |          |        |      | ANN        |         | ("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024") |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
```

The output includes columns such as `Table`, `Key_name`, `Index_type` (shows `ANN` for ANN indexes), and `Properties` (containing the index configuration).
