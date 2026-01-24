---
{
    "title": "ANN 索引管理",
    "language": "zh-CN",
    "description": "Apache Doris 中的近似最近邻 (ANN) 索引支持对高维数据进行高效的向量相似性搜索。从 Doris 4.x 开始，通用索引操作语法也支持了 ANN 索引。本文将介绍 ANN 索引相关操作的具体 SQL 语法，并提供详细的参数说明。"
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



# ANN 索引管理

## 概述

Apache Doris 中的近似最近邻 (ANN) 索引支持对高维数据进行高效的向量相似性搜索。从 Doris 4.x 开始，通用索引操作语法也支持了 ANN 索引。本文将介绍 ANN 索引相关操作的具体 SQL 语法，并提供详细的参数说明。

ANN 索引建立在向量列上（`ARRAY<FLOAT> NOT NULL` 类型），支持两种度量类型包括 l2 distance(也叫欧式距离)和inner product(内积)。

## 创建 ANN 索引

可以使用带有 `USING ANN` 的 `CREATE INDEX` 语句创建 ANN 索引。有两种主要方法：

1. **在表创建期间定义索引**：索引在数据加载时同步构建。

### 语法

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

2. **单独创建索引**：先定义索引，然后使用 `BUILD INDEX` 在现有数据上构建。

### 语法

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

### 通用属性

- `index_type`: ANN 索引的类型。支持的值："ivf" 或 "hnsw"。
- `metric_type`: 度量类型。支持的值："l2_distance"、"inner_product"。
- `dim`: 向量列的维度。
- `quantizer`: 量化器类型。支持的值：flat、sq4、sq8、pq。不指定时默认为 flat。

### 索引特定属性

#### IVF 索引属性

- `nlist`: 聚类数量（倒排列表）。默认：1024。更高的值改善召回率但增加构建时间和内存使用。

#### HNSW 索引属性

- `max_degree`: 每个节点的连接最大数量。默认：32。影响召回率和查询性能。
- `ef_construction`: 索引构建期间候选队列的大小。默认：40。更高的值改善图质量但增加构建时间。

### 量化特定属性

对于量化器属性：

- `sq4`: 标量量化 (SQ)，使用 4 位整数替代 32 位浮点数来存储向量的每个维度值。
- `sq8`: 标量量化 (SQ)，使用 8 位整数替代 32 位浮点数来存储向量的每个维度值。
- `pq`: 乘积量化 (PQ)，properties中需要额外指定两个参数，`pq_m` 和 `pq_nbits`

#### 乘积量化属性

- `pq_m`: 指定使用的子向量数量（向量维度 dim 必须能被 pq_m 整除）。
- `pq_nbits`: 用于表示每个子向量的比特数，在 faiss 中 pq_nbits 通常要求不超过 24。

### 示例

#### 创建带有 ANN 索引的表

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

#### IVF 索引

```sql
CREATE INDEX ann_ivf_index ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024"
);
```

#### HNSW 索引

```sql
CREATE INDEX ann_hnsw_index ON tbl_hnsw (`embedding`) USING ANN PROPERTIES(
    "index_type"="hnsw",
    "metric_type"="l2_distance",
    "dim"="128",
    "max_degree"="32",
    "ef_construction"="40"
);
```

#### HNSW + SQ

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

#### HNSW + PQ

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

#### IVF + SQ

```sql
CREATE INDEX ann_ivf_sq ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024",
    "quantizer"="sq8"
);
```

#### IVF + PQ

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

## 构建 ANN 索引

对于单独创建的索引，使用 `BUILD INDEX` 在现有数据上构建索引。这个操作是异步的。

### 语法

```sql
BUILD INDEX <index_name> ON <table_name> [PARTITION (<partition_name> [, ...])]
```

### 监控构建进度

使用 `SHOW BUILD INDEX` 检查索引构建的进度和状态。

```sql
-- 查看所有 BUILD INDEX 任务的进度 [对于特定数据库]
SHOW BUILD INDEX [FROM db_name];

-- 查看特定表的 BUILD INDEX 任务进度
SHOW BUILD INDEX WHERE TableName = "<table_name>";
```

输出包括 `JobId`、`TableName`、`State`（例如 `FINISHED`、`RUNNING`）和 `Progress` 等列，例如：

```sql
mysql> show build index where TableName = "sift_1M";
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId         | TableName | PartitionName | AlterInvertedIndexes                                                                                                                                | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 1764579876673 | sift_1M   | sift_1M       | [ADD INDEX idx_test_ann (`embedding`) USING ANN PROPERTIES("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024")],  | 2025-12-01 17:59:54.277 | 2025-12-01 17:59:56.987 | 82            | FINISHED |      | NULL     |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
1 row in set (0.00 sec)
```

### 取消索引构建

要取消正在进行的索引构建：

```sql
CANCEL BUILD INDEX ON <table_name> [(<job_id> [, ...])]
```

## 删除 ANN 索引

使用 `DROP INDEX` 删除 ANN 索引。

### 语法

```sql
DROP INDEX [IF EXISTS] <index_name> ON [<db_name>.]<table_name>

-- or
ALTER TABLE [<db_name>.]<table_name> DROP INDEX <index_name>
```


## 查看 ANN 索引

使用 `SHOW INDEX` 或 `SHOW CREATE TABLE` 查看索引信息。

### 语法

```sql
SHOW INDEX[ES] FROM [<db_name>.]<table_name> [FROM <db_name>]

-- or
SHOW CREATE TABLE [<db_name>.]<table_name>
```

### 示例输出

```sql
mysql> SHOW INDEX FROM sift_1M;
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| Table   | Non_unique | Key_name     | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Properties                                                                             |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| sift_1M |            | idx_test_ann |              | embedding   |           |             |          |        |      | ANN        |         | ("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024") |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
```

输出包括 `Table`、`Key_name`、`Index_type`（ANN 索引显示 `ANN`）和 `Properties`（包含索引配置）等列。
