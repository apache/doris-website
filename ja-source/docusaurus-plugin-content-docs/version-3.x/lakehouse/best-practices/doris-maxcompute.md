---
{
  "title": "DorisとMaxCompute データ統合",
  "description": "Apache DorisとAlibaba Cloud MaxCompute間でMaxCompute カタログを通じて双方向データ統合を実現し、データインポート、ライトバック、データベース/table管理をサポートして、企業の効率的なlakehouseアーキテクチャの構築を支援します。",
  "language": "ja"
}
---
この文書では、[MaxCompute カタログ](../catalogs/maxcompute-catalog.md)を通じてApache DorisとAlibaba Cloud MaxCompute間でデータ統合を実現する方法について説明します：

- **データインポート**: MaxComputeからDorisにデータを迅速にインポートして分析を行います。
- **データライトバック** (4.1.0+): 分析結果やDoris内の他のソースからのデータをMaxComputeに書き戻します。
- **データベース/table管理** (4.1.0+): Doris内で直接MaxComputeデータベースとtableを作成・管理します。

この文書はApache Dorisバージョン2.1.9に基づいています。一部の機能にはバージョン4.1.0以降が必要です。

## 環境準備

### 01 MaxCompute Open Storage APIの有効化

[MaxCompute Console](https://maxcompute.console.aliyun.com/)で、左サイドバー -> `Tenant Management` -> `Tenant Properties` -> `Open Storage (Storage API) Switch`を有効化してください

### 02 MaxCompute権限の付与

DorisはAK/SKを使用してMaxComputeサービスにアクセスします。AK/SKに対応するIAMユーザーがMaxComputeサービスに対して以下のロールまたは権限を持っていることを確認してください：

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

Doris クラスターと MaxCompute サービスが同一の VPC 内にあり、適切なセキュリティグループが設定されていることを強く推奨します。

このドキュメントの例は、同一 VPC ネットワーク条件下でテストされています。

## MaxCompute データのインポート

### 01 カタログ の作成

```sql
CREATE CATALOG mc PROPERTIES (
    "type" = "max_compute",
    "mc.default.project" = "xxx",
    "mc.access_key" = "AKxxxxx",
    "mc.secret_key" = "SKxxxxx",
    "mc.endpoint" = "xxxxx"
);
```
Schema階層をサポートするには（3.1.3+）：

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
詳細については、[MaxCompute カタログ](../catalogs/maxcompute-catalog.md)のドキュメントを参照してください。

### 02 TPCHデータセットのインポート

MaxComputeパブリックデータセットのTPCH 100データセットを例として使用し（データは既にMaxComputeにインポート済み）、`CREATE TABLE AS SELECT`文を使用してMaxComputeのデータをDorisにインポートします。

このデータセットには7つのTableが含まれています。最大のTable`lineitem`は16列、600,037,902行で、約30GBのディスク容量を占有します。

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
単一のBE（16C 64G）を持つDorisクラスターにおいて、上記の操作を順次実行すると約6-7分かかります。

### 03 GitHub Eventデータセットのインポート

MaxCompute公開データセットのGitHub Eventデータセットを例として使用し（データは既にMaxComputeにインポート済み）、`CREATE TABLE AS SELECT`文を使用してMaxComputeのデータをDorisにインポートします。

ここでは`dwd_github_events_odps`Tableの365パーティション（`2015-01-01`から`2016-01-01`まで）からデータを選択します。このデータには32カラム、212,786,803行が含まれており、約10GBのディスク容量を占有します。

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
単一のBE（16C 64G）を持つDorisクラスターでは、上記の操作には約2分かかります。

## MaxComputeへのデータ書き戻し（4.1.0+）

バージョン4.1.0から、DorisはMaxComputeへのデータ書き戻しをサポートしています。この機能は以下のシナリオに適用できます：

- **分析結果の書き戻し**: Dorisでデータ分析を完了した後、結果をMaxComputeに書き戻して他のシステムで使用する。
- **データ処理**: Dorisの強力な計算能力を活用してデータのETL処理を実行し、処理済みデータをMaxComputeに保存する。
- **クロスソースデータ統合**: 複数のソースからのデータをDorisで統合し、統一管理のためMaxComputeに書き込む。

:::note
- これは実験的機能で、バージョン4.1.0からサポートされています。
- パーティション化されたTableとパーティション化されていないTableへの書き込みをサポートしています。
- clusteredTable、transactionalTable、Delta Tables、external tablesへの書き込みはサポートしていません。
:::

### 01 INSERT INTO追記書き込み

INSERT操作はMaxCompute対象Tableにデータを追記します。

```sql
-- Switch to MaxCompute カタログ
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
### 02 INSERT OVERWRITE Overwrite Write

INSERT OVERWRITEは、Table内の既存データを新しいデータで完全に置き換えます。

```sql
-- Full table overwrite
INSERT OVERWRITE TABLE mc_db.mc_tbl VALUES (val1, val2, val3, val4);

-- Overwrite from another table
INSERT OVERWRITE TABLE mc_db.mc_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;

-- Overwrite specific partition
INSERT OVERWRITE TABLE mc_db.mc_tbl PARTITION(ds='20250101') VALUES (10, 'new1');
```
### 03 CTAS Create Table and Write

`CREATE TABLE AS SELECT`文を使用して、MaxComputeで新しいTableを作成し、データを書き込むことができます。

```sql
-- Create table in MaxCompute and import data
CREATE TABLE mc_db.mc_new_tbl AS SELECT * FROM internal.db1.source_tbl;
```
## Database/Table Management (4.1.0+)

バージョン4.1.0以降、DorisはMaxComputeでのデータベースとTableの作成・削除を直接サポートします。この機能は以下のシナリオに適用されます：

- **統合データ管理**: 複数のデータソースからのメタデータをDorisで一元管理し、MaxComputeコンソールへの切り替えが不要になります。
- **自動化されたデータパイプライン**: ETLワークフローでターゲットTableを動的に作成し、エンドツーエンドの自動化を実現します。

:::note
- これは実験的機能で、バージョン4.1.0以降でサポートされます。
- この機能は`mc.enable.namespace.schema`プロパティが`true`に設定されている場合のみ利用可能です。
- パーティション化Tableと非パーティション化Tableの作成・削除をサポートします。
- クラスター化Table、トランザクショナルTable、Delta Tables、外部Tableの作成はサポートしていません。
:::

### 01 Create and Drop Database

```sql
-- Switch to MaxCompute カタログ
SWITCH mc;

-- Create Schema
CREATE DATABASE IF NOT EXISTS mc_schema;

-- Create using fully qualified name
CREATE DATABASE IF NOT EXISTS mc.mc_schema;

-- Drop Schema (will also delete all tables within it)
DROP DATABASE IF EXISTS mc.mc_schema;
```
:::caution
MaxCompute Databaseの場合、削除するとその中のすべてのTableも削除されます。注意して実行してください。
:::

### 02 Tableの作成と削除

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
詳細については、[MaxCompute カタログ](../catalogs/maxcompute-catalog.md) ドキュメントを参照してください。
