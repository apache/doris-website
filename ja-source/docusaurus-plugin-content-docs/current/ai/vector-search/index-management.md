---
{
  "title": "ANNインデックス管理",
  "language": "ja",
  "description": "Apache DorisのApproximate Nearest Neighbor（ANN）インデックスは、高次元データに対する効率的なベクトル類似性検索を可能にします。Doris 4.x以降、"
}
---
<!-- 
Apache Software Foundation (ASF) のライセンスの下で許可されています。
1つまたは複数の貢献者ライセンス契約に従って。追加情報については
この作業と共に配布されているNOTICEファイルを参照してください。
著作権の所有権について。ASFはこのファイルを
Apache License, Version 2.0（以下
「ライセンス」）の下であなたにライセンスします。ライセンスに
準拠しない場合、このファイルを使用することはできません。
ライセンスのコピーは以下で入手できます：

  http://www.apache.org/licenses/LICENSE-2.0

適用法で要求されるか書面で合意されない限り、
ライセンスの下で配布されるソフトウェアは「現状のまま」で
配布され、明示的または黙示的を問わず、いかなる種類の
保証や条件もありません。ライセンスの下での特定の
言語による権限と制限については、ライセンスを
参照してください。
-->



# ANN Index管理

## 概要

Apache DorisのApproximate Nearest Neighbor (ANN) indexは、高次元データに対する効率的なベクトル類似検索を可能にします。Doris 4.xからは、汎用的なindex操作構文もANN indexをカバーするよう拡張されました。この記事では、ANN index関連操作の具体的なSQL構文を紹介し、詳細なパラメータ説明を提供します。

ANN indexはベクトル列（通常は`ARRAY<FLOAT> NOT NULL`型）に構築され、サポートされる距離メトリックにはL2距離と内積が含まれます。

## ANN Indexの作成

ANN indexは`USING ANN`を使用した`CREATE INDEX`文で作成できます。主に2つのアプローチがあります：

1. **テーブル作成時にindexを定義する**：データがロードされる際にindexが同期的に構築されます。

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
2. **インデックスを個別に作成**: 最初にインデックスを定義し、次に`BUILD INDEX`を使用して既存のデータ上でインデックスを構築します。

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

- `nlist`: クラスタ数（転置リスト）。デフォルト: 1024。値が高いほど再現率が向上しますが、構築時間とメモリ使用量が増加します。

#### HNSWインデックスのプロパティ

- `max_degree`: ノードあたりの最大接続数。デフォルト: 32。再現率とクエリパフォーマンスに影響します。
- `ef_construction`: インデックス構築時の候補キューのサイズ。デフォルト: 40。値が高いほどグラフ品質が向上しますが、構築時間が増加します。

### 量子化固有のプロパティ

quantizerプロパティについて:

- `sq4`: Scalar Quantization (SQ)、ベクトルの各次元値を格納するために、通常の32ビット浮動小数点数の代わりに4ビット整数を使用します。
- `sq8`: Scalar Quantization (SQ)、ベクトルの各次元値を格納するために、通常の32ビット浮動小数点数の代わりに8ビット整数を使用します。
- `pq`: Product Quantization (PQ)、2つの追加パラメータ `pq_m` と `pq_nbits` がプロパティに必要です。

#### Product Quantizationのプロパティ

- `pq_m`: 使用するサブベクトルの数を指定します（ベクトル次元dimはpq_mで割り切れる必要があります）。
- `pq_nbits`: 各サブベクトルを表現するために使用されるビット数。faissでは、pq_nbitsは一般的に24以下である必要があります。

### 例

#### ANNインデックス付きテーブルの作成

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
#### PQ付きHNSWインデックス

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
#### PQ付きIVFインデックス

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
## ANN インデックスの構築

別途作成されたインデックス（テーブル作成時ではない）の場合、`BUILD INDEX`を使用して既存のデータにインデックスを構築します。この操作は非同期です。

### 構文

```sql
BUILD INDEX <index_name> ON <table_name> [PARTITION (<partition_name> [, ...])]
```
### ビルド進行状況の監視

`SHOW BUILD INDEX`を使用してインデックスビルドジョブのステータスを確認します。

```sql
-- view all the progress of BUILD INDEX tasks [for a specific database]
SHOW BUILD INDEX [FROM db_name];

-- view the progress of BUILD INDEX tasks for a specific table
SHOW BUILD INDEX WHERE TableName = "<table_name>";
```
出力には、`JobId`、`TableName`、`State`（例：`FINISHED`、`RUNNING`）、`Progress`などの列が含まれます。例：

```sql
mysql> show build index where TableName = "sift_1M";
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId         | TableName | PartitionName | AlterInvertedIndexes                                                                                                                                | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 1764579876673 | sift_1M   | sift_1M       | [ADD INDEX idx_test_ann (`embedding`) USING ANN PROPERTIES("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024")],  | 2025-12-01 17:59:54.277 | 2025-12-01 17:59:56.987 | 82            | FINISHED |      | NULL     |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
1 row in set (0.00 sec)
```
### インデックスビルドのキャンセル

進行中のインデックスビルドをキャンセルするには:

```sql
CANCEL BUILD INDEX ON <table_name> [(<job_id> [, ...])]
```
## ANN インデックスの削除

`DROP INDEX` を使用して ANN インデックスを削除します。

### 構文

```sql
DROP INDEX [IF EXISTS] <index_name> ON [<db_name>.]<table_name>

-- or
ALTER TABLE [<db_name>.]<table_name> DROP INDEX <index_name>
```
## ANN インデックスの表示

`SHOW INDEX` または `SHOW CREATE TABLE` を使用してテーブルのインデックスに関する情報を表示します。

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
