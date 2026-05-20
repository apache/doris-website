---
{
    "title": "ANN 索引管理",
    "language": "zh-CN",
    "description": "Apache Doris ANN 向量索引的创建、构建、查看与删除完整 SQL 操作指南，含 HNSW、IVF 与量化参数说明。",
    "keywords": [
        "ANN 索引",
        "向量索引管理",
        "HNSW",
        "IVF",
        "向量相似性搜索",
        "Doris 向量检索",
        "BUILD INDEX",
        "标量量化 SQ",
        "乘积量化 PQ"
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

<!-- 知识类型: 操作步骤 + 配置参数 -->
<!-- 适用场景: 向量检索建表 / 索引运维 / 性能调优 -->

# ANN 索引管理

Apache Doris 的近似最近邻 (Approximate Nearest Neighbor，简称 ANN) 索引用于在高维向量列上进行高效的向量相似性搜索。从 Doris 4.x 开始，通用索引操作语法已经覆盖 ANN 索引。本文聚焦于 ANN 索引相关的 SQL 操作语法与参数说明。

## 快速导航

读者可根据使用场景跳转至对应章节：

| 场景                                  | 跳转章节                            |
| ------------------------------------- | ----------------------------------- |
| 第一次为向量列建索引                  | [创建 ANN 索引](#创建-ann-索引)     |
| 在已有数据上离线构建索引              | [构建 ANN 索引](#构建-ann-索引)     |
| 查看现有索引及其参数配置              | [查看 ANN 索引](#查看-ann-索引)     |
| 删除不再需要的索引                    | [删除 ANN 索引](#删除-ann-索引)     |
| 选择 HNSW / IVF / 量化器等具体算法    | [索引参数说明](#索引参数说明)       |

## 前置条件

在创建 ANN 索引之前，请确认：

-   向量列的数据类型为 `ARRAY<FLOAT> NOT NULL`。
-   已选择合适的度量类型：`l2_distance`（欧式距离）或 `inner_product`（内积）。
-   已根据数据规模与召回率/性能要求选定索引算法（HNSW、IVF 或 IVF On-Disk）。

## 创建 ANN 索引

Doris 提供两种创建 ANN 索引的方式，可根据数据是否已经入库来选择：

| 方式                | 适用场景                              | 索引构建时机                    |
| ------------------- | ------------------------------------- | ------------------------------- |
| 建表时定义索引      | 表尚未创建，或需要随数据写入持续构建  | 数据加载时同步构建              |
| 单独创建并构建索引  | 表已存在并写入数据，需要补建索引      | 通过 `BUILD INDEX` 异步构建     |

### 方式一：建表时定义索引

在 `CREATE TABLE` 语句的列定义之后通过 `INDEX ... USING ANN` 直接声明 ANN 索引。索引会随数据加载同步构建。

```sql
CREATE TABLE [IF NOT EXISTS] <table_name> (
    <columns_definition>
    INDEX <index_name> (<vector_column>) USING ANN PROPERTIES (
        "<key>" = "<value>" [, ...]
    )
)
...
```

### 方式二：单独创建索引

对已经存在的表，可使用 `CREATE INDEX` 或 `ALTER TABLE ADD INDEX` 添加 ANN 索引，再通过 [BUILD INDEX](#构建-ann-索引) 在已有数据上完成构建。

```sql
CREATE INDEX [IF NOT EXISTS] <index_name>
             ON <table_name> (<column_name>)
             USING ANN
             PROPERTIES ("<key>" = "<value>" [, ...])
             [COMMENT '<index_comment>']

-- 或

ALTER TABLE <table_name> ADD INDEX <index_name>(<column_name>)
             USING ANN
             [PROPERTIES ("<key>" = "<value>" [, ...])]
             [COMMENT '<index_comment>']
```

## 索引参数说明

ANN 索引的行为由 `PROPERTIES` 中的属性决定，分为通用属性、索引算法特定属性和量化器特定属性三类。

### 通用属性

所有 ANN 索引都需要配置的基础属性：

| 属性          | 说明                                                                       | 默认值 |
| ------------- | -------------------------------------------------------------------------- | ------ |
| `index_type`  | ANN 索引类型，可选值：`ivf`、`ivf_on_disk`、`hnsw`                         | -      |
| `metric_type` | 度量类型，可选值：`l2_distance`（欧式距离）、`inner_product`（内积）       | -      |
| `dim`         | 向量列的维度                                                               | -      |
| `quantizer`   | 量化器类型，可选值：`flat`、`sq4`、`sq8`、`pq`                             | `flat` |

### 索引算法特定属性

#### IVF / IVF On-Disk

| 属性    | 说明                                                                                              | 默认值 |
| ------- | ------------------------------------------------------------------------------------------------- | ------ |
| `nlist` | 聚类数量（倒排列表数）。`ivf` 与 `ivf_on_disk` 均需配置。值越大召回率越高，但构建时间与资源消耗增加 | `1024` |

#### HNSW

| 属性              | 说明                                                                       | 默认值 |
| ----------------- | -------------------------------------------------------------------------- | ------ |
| `max_degree`      | 每个节点的最大连接数，影响召回率与查询性能                                 | `32`   |
| `ef_construction` | 索引构建期间候选队列的大小。值越大图质量越高，但构建时间增加               | `40`   |

### 量化器特定属性

`quantizer` 用于压缩向量存储，不同量化器的差异如下：

| 量化器 | 含义                                                                                  | 额外参数                  |
| ------ | ------------------------------------------------------------------------------------- | ------------------------- |
| `flat` | 不进行量化，使用原始 32 位浮点数存储                                                  | 无                        |
| `sq4`  | 标量量化 (Scalar Quantization)，使用 4 位整数替代 32 位浮点数存储每个维度             | 无                        |
| `sq8`  | 标量量化 (Scalar Quantization)，使用 8 位整数替代 32 位浮点数存储每个维度             | 无                        |
| `pq`   | 乘积量化 (Product Quantization)，将向量切分为若干子向量后分别量化                     | 需指定 `pq_m`、`pq_nbits` |

#### 乘积量化 (PQ) 额外参数

| 属性        | 说明                                                                       |
| ----------- | -------------------------------------------------------------------------- |
| `pq_m`      | 子向量数量，向量维度 `dim` 必须能被 `pq_m` 整除                            |
| `pq_nbits`  | 表示每个子向量的比特数。在 faiss 中 `pq_nbits` 通常要求不超过 24           |

## 创建索引示例

下面给出常见组合的 SQL 示例，可作为模板复制使用。

### 建表时声明 HNSW 索引

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

### IVF 索引

```sql
CREATE INDEX ann_ivf_index ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024"
);
```

### HNSW 索引

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

## 构建 ANN 索引

对于通过 `CREATE INDEX` 或 `ALTER TABLE ADD INDEX` 单独创建的索引，需要使用 `BUILD INDEX` 在已有数据上构建。该操作是**异步**执行的。

### 触发构建

```sql
BUILD INDEX <index_name> ON <table_name> [PARTITION (<partition_name> [, ...])]
```

### 监控构建进度

通过 `SHOW BUILD INDEX` 查看索引构建任务的进度与状态：

```sql
-- 查看所有 BUILD INDEX 任务的进度（可指定数据库）
SHOW BUILD INDEX [FROM db_name];

-- 查看特定表的 BUILD INDEX 任务进度
SHOW BUILD INDEX WHERE TableName = "<table_name>";
```

输出包含 `JobId`、`TableName`、`State`（如 `FINISHED`、`RUNNING`）、`Progress` 等列。示例：

```sql
mysql> show build index where TableName = "sift_1M";
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId         | TableName | PartitionName | AlterInvertedIndexes                                                                                                                                | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 1764579876673 | sift_1M   | sift_1M       | [ADD INDEX idx_test_ann (`embedding`) USING ANN PROPERTIES("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024")],  | 2025-12-01 17:59:54.277 | 2025-12-01 17:59:56.987 | 82            | FINISHED |      | NULL     |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
1 row in set (0.00 sec)
```

### 取消构建

如需取消正在进行的索引构建任务：

```sql
CANCEL BUILD INDEX ON <table_name> [(<job_id> [, ...])]
```

## 查看 ANN 索引

可以通过 `SHOW INDEX` 或 `SHOW CREATE TABLE` 查看索引信息：

```sql
SHOW INDEX[ES] FROM [<db_name>.]<table_name> [FROM <db_name>]

-- 或

SHOW CREATE TABLE [<db_name>.]<table_name>
```

`SHOW INDEX` 的输出包含 `Table`、`Key_name`、`Index_type`（ANN 索引显示为 `ANN`）以及 `Properties`（包含索引完整配置）等列。示例：

```sql
mysql> SHOW INDEX FROM sift_1M;
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| Table   | Non_unique | Key_name     | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Properties                                                                             |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| sift_1M |            | idx_test_ann |              | embedding   |           |             |          |        |      | ANN        |         | ("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024") |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
```

## 删除 ANN 索引

使用 `DROP INDEX` 或 `ALTER TABLE DROP INDEX` 删除已有的 ANN 索引：

```sql
DROP INDEX [IF EXISTS] <index_name> ON [<db_name>.]<table_name>

-- 或

ALTER TABLE [<db_name>.]<table_name> DROP INDEX <index_name>
```
