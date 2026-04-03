---
{
  "title": "ANNインデックス管理",
  "description": "Apache DorisのApproximate Nearest Neighbor (ANN) インデックスは、高次元データに対する効率的なベクトル類似性検索を可能にします。Doris 4.xから、",
  "language": "ja"
}
---
# ANN Index管理

## 概要

Apache DorisのApproximate Nearest Neighbor (ANN) indexは、高次元データに対する効率的なベクトル類似度検索を可能にします。Doris 4.x以降、汎用的なindex操作構文もANN indexを対象とするように拡張されました。本記事では、ANN index関連操作の具体的なSQL構文を紹介し、詳細なパラメータ説明を提供します。

ANN indexはベクトル列（通常は`ARRAY<FLOAT> NOT NULL`型）上に構築され、サポートされる距離メトリックにはL2距離と内積が含まれます。

## ANN Indexの作成

ANN indexは`USING ANN`を指定した`CREATE INDEX`文を使用して作成できます。主なアプローチは2つあります：

1. **table作成時にindexを定義**: データがロードされるのと同期してindexが構築されます。

### 構文

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
2. **インデックスを個別に作成する**: まずインデックスを定義し、次に`BUILD INDEX`を使用して既存のデータ上にそれを構築します。

### 構文

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
### 一般的なプロパティ

- `index_type`: ANNインデックスのタイプ。サポートされる値: `"ivf"` または `"hnsw"`。
- `metric_type`: 距離メトリック。サポートされる値: `"l2_distance"`、`"inner_product"`。
- `dim`: ベクトル列の次元数。
- `quantizer`: 量子化タイプ。サポートされる値: `flat`、`sq4`、`sq8`、`pq`。指定されない場合のデフォルトは `flat`。

### インデックス固有のプロパティ

#### IVFインデックスのプロパティ

- `nlist`: クラスタ数（転置リスト）。デフォルト: 1024。値が高いほど再現率は向上しますが、構築時間とメモリ使用量が増加します。

#### HNSWインデックスのプロパティ

- `max_degree`: ノードあたりの最大接続数。デフォルト: 32。再現率とクエリパフォーマンスに影響します。
- `ef_construction`: インデックス構築時の候補キューのサイズ。デフォルト: 40。値が高いほどグラフ品質は向上しますが、構築時間が増加します。

### 量子化固有のプロパティ

quantizerプロパティについて:

- `sq4`: Scalar Quantization (SQ)。ベクトルの各次元値を格納するために、一般的な32ビット浮動小数点数の代わりに4ビット整数を使用します。
- `sq8`: Scalar Quantization (SQ)。ベクトルの各次元値を格納するために、一般的な32ビット浮動小数点数の代わりに8ビット整数を使用します。
- `pq`: Product Quantization (PQ)。2つの追加パラメータ `pq_m` と `pq_nbits` がプロパティで必要です。

#### Product Quantizationのプロパティ

- `pq_m`: 使用するサブベクトル数を指定します（ベクトル次元dimはpq_mで割り切れる必要があります）。
- `pq_nbits`: 各サブベクトルを表現するために使用するビット数。faissでは、pq_nbitsは一般的に24以下である必要があります。

### 例

#### ANNインデックス付きTableの作成

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
#### SQを使用したHNSWインデックス

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
#### PQを使用したHNSWインデックス

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
#### SQを使用したIVFインデックス

```sql
CREATE INDEX ann_ivf_sq ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024",
    "quantizer"="sq8"
);
```
#### PQを用いたIVFインデックス

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
## ANN Indexの構築

個別に作成されたindex（Table作成時以外）については、`BUILD INDEX`を使用して既存のデータに対してindexを構築してください。この操作は非同期で実行されます。

### 構文

```sql
BUILD INDEX <index_name> ON <table_name> [PARTITION (<partition_name> [, ...])]
```
### ビルド進行状況の監視

`SHOW BUILD INDEX` を使用してインデックスビルドジョブのステータスを確認します。

```sql
-- view all the progress of BUILD INDEX tasks [for a specific database]
SHOW BUILD INDEX [FROM db_name];

-- view the progress of BUILD INDEX tasks for a specific table
SHOW BUILD INDEX WHERE TableName = "<table_name>";
```
出力には`JobId`、`TableName`、`State`（例：`FINISHED`、`RUNNING`）、`Progress`などの列が含まれます。例：

```sql
mysql> show build index where TableName = "sift_1M";
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId         | TableName | PartitionName | AlterInvertedIndexes                                                                                                                                | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 1764579876673 | sift_1M   | sift_1M       | [ADD INDEX idx_test_ann (`embedding`) USING ANN PROPERTIES("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024")],  | 2025-12-01 17:59:54.277 | 2025-12-01 17:59:56.987 | 82            | FINISHED |      | NULL     |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
1 row in set (0.00 sec)
```
### Index Build のキャンセル

進行中の index build をキャンセルするには:

```sql
CANCEL BUILD INDEX ON <table_name> [(<job_id> [, ...])]
```
## ANN Indexesの削除

`DROP INDEX`を使用してANN indexを削除します。

### 構文

```sql
DROP INDEX [IF EXISTS] <index_name> ON [<db_name>.]<table_name>

-- or
ALTER TABLE [<db_name>.]<table_name> DROP INDEX <index_name>
```
## ANN Indexesの表示

`SHOW INDEX`または`SHOW CREATE TABLE`を使用してTable上のインデックスに関する情報を表示します。

### 構文

```sql
SHOW INDEX[ES] FROM [<db_name>.]<table_name> [FROM <db_name>]

-- or
SHOW CREATE TABLE [<db_name>.]<table_name>
```
### 出力例

```sql
mysql> SHOW INDEX FROM sift_1M;
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| Table   | Non_unique | Key_name     | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Properties                                                                             |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| sift_1M |            | idx_test_ann |              | embedding   |           |             |          |        |      | ANN        |         | ("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024") |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
```
出力には、`Table`、`Key_name`、`Index_type`（ANNインデックスの場合は`ANN`を表示）、`Properties`（インデックス設定を含む）などの列が含まれます。
