---
{
    "title": "Doris と MaxCompute のデータ連携",
    "language": "ja",
    "description": "MaxCompute Catalog を使用して Apache Doris と Alibaba Cloud MaxCompute の間で双方向のデータ連携を実現します。データの取り込み、書き戻し、データベースとテーブルの管理をサポートし、効率的なレイクハウス構成の構築に役立ちます。"
}
---

このドキュメントでは、[MaxCompute Catalog](../catalogs/maxcompute-catalog.md) を使用して Apache Doris と Alibaba Cloud MaxCompute の間でデータを連携する方法を説明します。

- **データの取り込み**: MaxCompute から Doris にデータを素早く取り込み、分析します。
- **データの書き戻し** (4.1.0 以降): Doris で得られた分析結果や、ほかのソースから取り込んだデータを MaxCompute に書き戻します。
- **データベースとテーブルの管理** (4.1.0 以降): Doris から直接 MaxCompute のデータベースとテーブルを作成、管理します。

このドキュメントは Apache Doris バージョン 2.1.9 に基づいています。一部の機能にはバージョン 4.1.0 以降が必要です。

## 環境の準備

### 01 MaxCompute Open Storage API の有効化

[MaxCompute コンソール](https://maxcompute.console.aliyun.com/)の左側のサイドバーから `Tenant Management` -> `Tenant Properties` に移動し、`Open Storage (Storage API) Switch` を有効にします。

### 02 MaxCompute の権限付与

Doris は AK/SK を使用して MaxCompute のサービスにアクセスします。AK/SK に対応する IAM ユーザーに、MaxCompute サービスに対する次のロールまたは権限があることを確認してください。

```json
{
    "Statement": [
        {
            "Action": [
                "odps:List",
                "odps:Usage"
            ],
            "Effect": "Allow",
            "Resource": ["acs:odps:*:regions/*/quotas/pay-as-you-go"]
        }
    ],
    "Version": "1"
}
```

### 03 Doris と MaxCompute のネットワーク環境の確認

Doris クラスターと MaxCompute サービスを同じ VPC 内に配置し、セキュリティグループを適切に設定することを強く推奨します。

このドキュメントの例は、両者が同じ VPC にあるネットワーク環境でテストされています。

## MaxCompute データの取り込み

### 01 Catalog の作成

```sql
CREATE CATALOG mc PROPERTIES (
    "type" = "max_compute",
    "mc.default.project" = "xxx",
    "mc.access_key" = "AKxxxxx",
    "mc.secret_key" = "SKxxxxx",
    "mc.endpoint" = "xxxxx"
);
```

スキーマ階層を使用する場合 (3.1.3 以降):

```sql
CREATE CATALOG mc PROPERTIES (
    "type" = "max_compute",
    "mc.default.project" = "xxx",
    "mc.access_key" = "AKxxxxx",
    "mc.secret_key" = "SKxxxxx",
    "mc.endpoint" = "xxxxx",
    "mc.enable.namespace.schema" = "true"
);
```

詳細については、[MaxCompute Catalog](../catalogs/maxcompute-catalog.md) のドキュメントを参照してください。

### 02 TPCH データセットの取り込み

MaxCompute のパブリックデータセットに含まれる TPCH 100 データセットを例に (データはすでに MaxCompute に取り込まれています)、`CREATE TABLE AS SELECT` 文を使用して MaxCompute のデータを Doris に取り込みます。

このデータセットには 7 つのテーブルが含まれます。最大の `lineitem` テーブルには 16 列、600,037,902 行があり、ディスク使用量は約 30GB です。

```sql
-- switch catalog
SWITCH internal;
-- create database
CREATE DATABASE tpch_100g;
-- ingest data
CREATE TABLE tpch_100g.lineitem AS SELECT * FROM mc.selectdb_test.lineitem;
CREATE TABLE tpch_100g.nation AS SELECT * FROM mc.selectdb_test.nation;
CREATE TABLE tpch_100g.orders AS SELECT * FROM mc.selectdb_test.orders;
CREATE TABLE tpch_100g.part AS SELECT * FROM mc.selectdb_test.part;
CREATE TABLE tpch_100g.partsupp AS SELECT * FROM mc.selectdb_test.partsupp;
CREATE TABLE tpch_100g.region AS SELECT * FROM mc.selectdb_test.region;
CREATE TABLE tpch_100g.supplier AS SELECT * FROM mc.selectdb_test.supplier;
```

単一の BE (16C 64G) で構成された Doris クラスターでは、上記の操作を順番に実行すると約 6～7 分かかります。

### 03 GitHub Event データセットの取り込み

MaxCompute のパブリックデータセットに含まれる GitHub Event データセットを例に (データはすでに MaxCompute に取り込まれています)、`CREATE TABLE AS SELECT` 文を使用して MaxCompute のデータを Doris に取り込みます。

ここでは、`dwd_github_events_odps` テーブルの `2015-01-01` から `2016-01-01` までの 365 パーティションからデータを選択します。このデータには 32 列、212,786,803 行があり、ディスク使用量は約 10GB です。

```sql
-- switch catalog
SWITCH internal;
-- create database
CREATE DATABASE github_events;
-- ingest data
CREATE TABLE github_events.dwd_github_events_odps
AS SELECT * FROM mc.github_events.dwd_github_events_odps
WHERE ds BETWEEN '2015-01-01' AND '2016-01-01';
```

単一の BE (16C 64G) で構成された Doris クラスターでは、上記の操作に約 2 分かかります。

## MaxCompute へのデータの書き戻し (4.1.0 以降)

バージョン 4.1.0 以降、Doris は MaxCompute へのデータの書き戻しをサポートします。この機能は次のような場面で使用できます。

- **分析結果の書き戻し**: Doris でデータ分析を終えた後、結果を MaxCompute に書き戻し、ほかのシステムで利用します。
- **データ処理**: Doris の高い計算能力を使用してデータを ETL 処理し、処理後のデータを MaxCompute に保存します。
- **複数ソース間のデータ連携**: 複数のソースのデータを Doris に集約し、MaxCompute に書き込んで一元管理します。

:::note
- この機能は実験的な機能であり、バージョン 4.1.0 以降でサポートされます。
- パーティションテーブルと非パーティションテーブルへの書き込みをサポートします。
- クラスターテーブル、トランザクションテーブル、Delta Table、外部テーブルへの書き込みはサポートしません。
:::

### 01 INSERT INTO による追記

INSERT 操作は MaxCompute の対象テーブルにデータを追記します。

```sql
-- Switch to MaxCompute Catalog
SWITCH mc;

-- Insert a single row of data
INSERT INTO mc_db.mc_tbl VALUES (val1, val2, val3, val4);

-- Import data from Doris internal table to MaxCompute
INSERT INTO mc_db.mc_tbl SELECT col1, col2 FROM internal.db1.tbl1;

-- Write to specific columns
INSERT INTO mc_db.mc_tbl(col1, col2) VALUES (val1, val2);

-- Write to specific partition (you can specify only some partition columns, with the rest written dynamically)
INSERT INTO mc_db.mc_tbl PARTITION(ds='20250201') SELECT id, name FROM internal.db1.source_tbl;
```

### 02 INSERT OVERWRITE による上書き

INSERT OVERWRITE は、テーブル内の既存データを新しいデータで完全に置き換えます。

```sql
-- Full table overwrite
INSERT OVERWRITE TABLE mc_db.mc_tbl VALUES (val1, val2, val3, val4);

-- Overwrite from another table
INSERT OVERWRITE TABLE mc_db.mc_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;

-- Overwrite specific partition
INSERT OVERWRITE TABLE mc_db.mc_tbl PARTITION(ds='20250101') VALUES (10, 'new1');
```

### 03 CTAS によるテーブル作成と書き込み

`CREATE TABLE AS SELECT` 文を使用すると、MaxCompute に新しいテーブルを作成してデータを書き込めます。

```sql
-- Create table in MaxCompute and import data
CREATE TABLE mc_db.mc_new_tbl AS SELECT * FROM internal.db1.source_tbl;
```

## データベースとテーブルの管理 (4.1.0 以降)

バージョン 4.1.0 以降、Doris から直接 MaxCompute のデータベースとテーブルを作成、削除できます。この機能は次のような場面で使用できます。

- **データの一元管理**: MaxCompute コンソールに切り替えることなく、複数のデータソースのメタデータを Doris で一元管理します。
- **データパイプラインの自動化**: ETL ワークフロー内で対象テーブルを動的に作成し、処理全体を自動化します。

:::note
- この機能は実験的な機能であり、バージョン 4.1.0 以降でサポートされます。
- この機能を使用できるのは、`mc.enable.namespace.schema` プロパティを `true` に設定した場合のみです。
- パーティションテーブルと非パーティションテーブルの作成と削除をサポートします。
- クラスターテーブル、トランザクションテーブル、Delta Table、外部テーブルの作成はサポートしません。
:::

### 01 データベースの作成と削除

```sql
-- Switch to MaxCompute Catalog
SWITCH mc;

-- Create Schema
CREATE DATABASE IF NOT EXISTS mc_schema;

-- Create using fully qualified name
CREATE DATABASE IF NOT EXISTS mc.mc_schema;

-- Drop Schema (will also delete all tables within it)
DROP DATABASE IF EXISTS mc.mc_schema;
```

:::caution
MaxCompute のデータベースを削除すると、その中のすべてのテーブルも削除されます。慎重に操作してください。
:::

### 02 テーブルの作成と削除

```sql
-- Create non-partitioned table
CREATE TABLE mc_schema.mc_tbl1 (
    id INT,
    name STRING,
    amount DECIMAL(18, 6),
    create_time DATETIME
);

-- Create partitioned table
CREATE TABLE mc_schema.mc_tbl2 (
    id INT,
    val STRING,
    ds STRING,
    region STRING
)
PARTITION BY (ds, region)();

-- Drop table (will also delete data, including partition data)
DROP TABLE IF EXISTS mc_schema.mc_tbl1;
```

詳細については、[MaxCompute Catalog](../catalogs/maxcompute-catalog.md) のドキュメントを参照してください。
