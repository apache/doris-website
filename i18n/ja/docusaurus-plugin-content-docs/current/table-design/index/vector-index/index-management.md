---
{
    "title": "ANN インデックスの管理",
    "language": "ja",
    "description": "Apache Doris の ANN ベクトルインデックスについて、作成、構築、確認、削除を行う SQL 操作と、HNSW、IVF、量子化のパラメーターを説明します。",
    "keywords": [
        "ANN インデックス",
        "ベクトルインデックスの管理",
        "HNSW",
        "IVF",
        "ベクトル類似度検索",
        "Doris ベクトル検索",
        "BUILD INDEX",
        "スカラー量子化 SQ",
        "積量子化 PQ"
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

# ANN インデックスの管理

Apache Doris の近似最近傍（ANN）インデックスは、高次元ベクトル列の類似度検索を効率的に実行するために使用します。Doris 4.x 以降、一般的なインデックス操作の構文で ANN インデックスも扱えます。このドキュメントでは、ANN インデックスに関する SQL 操作の構文とパラメーターを説明します。

## クイックナビゲーション

目的に応じて、該当するセクションを参照してください。

| 目的 | セクション |
| ---- | ---------- |
| ベクトル列に初めてインデックスを作成する | [ANN インデックスの作成](#create-an-ann-index) |
| 既存データに対してインデックスをオフラインで構築する | [ANN インデックスの構築](#build-an-ann-index) |
| 既存のインデックスとそのパラメーター設定を確認する | [ANN インデックスの確認](#view-an-ann-index) |
| 不要になったインデックスを削除する | [ANN インデックスの削除](#drop-an-ann-index) |
| HNSW、IVF、量子化方式などのアルゴリズムを選択する | [インデックスパラメーター](#index-parameters) |

## 前提条件

ANN インデックスを作成する前に、次の点を確認してください。

- ベクトル列のデータ型が `ARRAY<FLOAT> NOT NULL` であること。
- 適切な距離尺度として、`l2_distance`（ユークリッド距離）または `inner_product` を選択していること。
- データ規模と再現率・性能の要件に応じて、インデックスアルゴリズム（HNSW、IVF、IVF On-Disk）を選択していること。

## ANN インデックスの作成 {#create-an-ann-index}

Doris では、ANN インデックスを二通りの方法で作成できます。データがすでに読み込まれているかどうかに応じて選択してください。

| 方法 | 適用シナリオ | インデックスの構築タイミング |
| ---- | ------------ | ---------------------------- |
| テーブル作成時にインデックスを定義する | テーブルをまだ作成していない場合、またはデータの書き込みに合わせてインデックスを継続的に構築する場合 | データ読み込み時に同期的に構築 |
| インデックスを別途作成して構築する | データが入った既存のテーブルに、後からインデックスを追加する場合 | `BUILD INDEX` によって非同期に構築 |

### 方法 1：テーブル作成時にインデックスを定義する

ANN インデックスは、`INDEX ... USING ANN` を使い、`CREATE TABLE` 文の列定義の後に直接宣言します。インデックスは、データの読み込みに合わせて同期的に構築されます。

```sql
CREATE TABLE [IF NOT EXISTS] <table_name> (
    <columns_definition>
    INDEX <index_name> (<vector_column>) USING ANN PROPERTIES (
        "<key>" = "<value>" [, ...]
    )
)
...
```

### 方法 2：インデックスを別途作成する

既存のテーブルには、`CREATE INDEX` または `ALTER TABLE ADD INDEX` で ANN インデックスを追加し、[BUILD INDEX](#build-an-ann-index) を使用して既存データに対するインデックスを構築します。

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

## インデックスパラメーター {#index-parameters}

ANN インデックスの動作は `PROPERTIES` の属性で決まります。属性は、共通属性、インデックスアルゴリズム固有の属性、量子化方式固有の属性の三種類に分かれます。

### 共通属性

すべての ANN インデックスで設定する基本的な属性は次のとおりです。

| 属性 | 説明 | デフォルト |
| ---- | ---- | ---------- |
| `index_type` | ANN インデックスの種類。指定可能な値：`ivf`、`ivf_on_disk`、`hnsw` | - |
| `metric_type` | 距離尺度の種類。指定可能な値：`l2_distance`（ユークリッド距離）、`inner_product` | - |
| `dim` | ベクトル列の次元数 | - |
| `quantizer` | 量子化方式の種類。指定可能な値：`flat`、`sq4`、`sq8`、`pq` | `flat` |

### インデックスアルゴリズム固有の属性

#### IVF / IVF On-Disk

| 属性 | 説明 | デフォルト |
| ---- | ---- | ---------- |
| `nlist` | クラスター（転置リスト）の数。`ivf` と `ivf_on_disk` の両方で必要です。値を大きくすると再現率が上がりますが、構築時間とリソース消費量も増加します。 | `1024` |

#### HNSW

| 属性 | 説明 | デフォルト |
| ---- | ---- | ---------- |
| `max_degree` | ノードあたりの最大接続数。再現率とクエリ性能に影響します。 | `32` |
| `ef_construction` | インデックス構築時の候補キューのサイズ。値を大きくするとグラフの品質が上がりますが、構築時間も長くなります。 | `40` |

### 量子化方式固有の属性

`quantizer` はベクトルの保存容量を圧縮するために使用します。各量子化方式の違いは次のとおりです。

| 量子化方式 | 内容 | 追加パラメーター |
| ---------- | ---- | ---------------- |
| `flat` | 量子化しません。ベクトルを元の 32 ビット浮動小数点数のまま保存します。 | なし |
| `sq4` | スカラー量子化。各次元を 32 ビット浮動小数点数の代わりに 4 ビット整数として保存します。 | なし |
| `sq8` | スカラー量子化。各次元を 32 ビット浮動小数点数の代わりに 8 ビット整数として保存します。 | なし |
| `pq` | 積量子化。ベクトルを複数のサブベクトルに分割し、それぞれを個別に量子化します。 | `pq_m` と `pq_nbits` が必要 |

#### 積量子化（PQ）の追加パラメーター

| 属性 | 説明 |
| ---- | ---- |
| `pq_m` | サブベクトルの数。ベクトルの次元数 `dim` は `pq_m` で割り切れる必要があります。 |
| `pq_nbits` | サブベクトルあたりのビット数。Faiss では通常、`pq_nbits` は 24 以下である必要があります。 |

## インデックス作成例

以下の SQL 例は一般的な組み合わせを示しており、テンプレートとして使用できます。

### テーブル作成時に HNSW インデックスを宣言する

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

### IVF インデックス

```sql
CREATE INDEX ann_ivf_index ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024"
);
```

### HNSW インデックス

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

## ANN インデックスの構築 {#build-an-ann-index}

`CREATE INDEX` または `ALTER TABLE ADD INDEX` で別途作成したインデックスには、`BUILD INDEX` を使用して既存データに対するインデックスを構築します。この操作は**非同期**で実行されます。

### 構築の開始

```sql
BUILD INDEX <index_name> ON <table_name> [PARTITION (<partition_name> [, ...])]
```

### 構築の進捗確認

`SHOW BUILD INDEX` を使用して、インデックス構築タスクの進捗と状態を確認します。

```sql
-- View the progress of all BUILD INDEX tasks (a database can be specified)
SHOW BUILD INDEX [FROM db_name];

-- View the progress of BUILD INDEX tasks for a specific table
SHOW BUILD INDEX WHERE TableName = "<table_name>";
```

出力には、`JobId`、`TableName`、`State`（`FINISHED` や `RUNNING` など）、`Progress` といった列が含まれます。例：

```sql
mysql> show build index where TableName = "sift_1M";
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId         | TableName | PartitionName | AlterInvertedIndexes                                                                                                                                | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 1764579876673 | sift_1M   | sift_1M       | [ADD INDEX idx_test_ann (`embedding`) USING ANN PROPERTIES("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024")],  | 2025-12-01 17:59:54.277 | 2025-12-01 17:59:56.987 | 82            | FINISHED |      | NULL     |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
1 row in set (0.00 sec)
```

### 構築のキャンセル

進行中のインデックス構築タスクをキャンセルするには、次の構文を使用します。

```sql
CANCEL BUILD INDEX ON <table_name> [(<job_id> [, ...])]
```

## ANN インデックスの確認 {#view-an-ann-index}

`SHOW INDEX` または `SHOW CREATE TABLE` を使用して、インデックスの情報を確認できます。

```sql
SHOW INDEX[ES] FROM [<db_name>.]<table_name> [FROM <db_name>]

-- Or

SHOW CREATE TABLE [<db_name>.]<table_name>
```

`SHOW INDEX` の出力には、`Table`、`Key_name`、`Index_type`（ANN インデックスでは `ANN` と表示）、`Properties`（インデックス設定全体を含む）といった列が含まれます。例：

```sql
mysql> SHOW INDEX FROM sift_1M;
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| Table   | Non_unique | Key_name     | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Properties                                                                             |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| sift_1M |            | idx_test_ann |              | embedding   |           |             |          |        |      | ANN        |         | ("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024") |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
```

## ANN インデックスの削除 {#drop-an-ann-index}

既存の ANN インデックスを削除するには、`DROP INDEX` または `ALTER TABLE DROP INDEX` を使用します。

```sql
DROP INDEX [IF EXISTS] <index_name> ON [<db_name>.]<table_name>

-- Or

ALTER TABLE [<db_name>.]<table_name> DROP INDEX <index_name>
```
