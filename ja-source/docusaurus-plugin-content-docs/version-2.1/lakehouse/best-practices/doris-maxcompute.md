---
{
  "title": "MaxComputeからDorisへ",
  "language": "ja",
  "description": "この文書では、MaxCompute カタログを使用してAlibaba Cloud MaxComputeからApache Dorisにデータを迅速にインポートする方法について説明します。"
}
---
この文書では、[MaxCompute カタログ](../catalogs/maxcompute-catalog.md)を使用して、Alibaba Cloud MaxComputeからApache Dorisにデータを迅速にインポートする方法について説明します。

この文書はApache Dorisバージョン2.1.9に基づいています。

## 環境準備

### 01 MaxCompute Open Storage APIの有効化

[MaxCompute Console](https://maxcompute.console.aliyun.com/)の左側ナビゲーションバーから`テナント管理` -> `テナントプロパティ` -> `Open Storage (Storage API) スイッチ`をオンにしてください。

### 02 MaxCompute権限の有効化

DorisはAK/SKを使用してMaxComputeサービスにアクセスします。AK/SKに対応するIAMユーザーが、対応するMaxComputeサービスに対して以下のロールまたは権限を持っていることを確認してください：

```json
{
    "Statement": [{
            "Action": ["odps:List",
                "odps:Usage"],
            "Effect": "Allow",
            "Resource": ["acs:odps:*:regions/*/quotas/pay-as-you-go"]}],
    "Version": "1"
}
```
### 03 DorisとMaxComputeのネットワーク環境の確認

DorisクラスターとMaxComputeサービスが同一VPC内にあり、正しいセキュリティグループが設定されていることを強く推奨します。

本ドキュメントの例は、同一VPCネットワーク環境でテストされています。

## MaxComputeデータのインポート

### 01 Catalogの作成

```sql
CREATE CATALOG mc PROPERTIES (
  "type" = "max_compute",
  "mc.default.project" = "xxx",
  "mc.access_key" = "AKxxxxx",
  "mc.secret_key" = "SKxxxxx",
  "mc.endpoint" = "xxxxx"
);
```
サポートスキーマレベル (3.1.3+):

```sql
CREATE CATALOG mc PROPERTIES (
  "type" = "max_compute",
  "mc.default.project" = "xxx",
  "mc.access_key" = "AKxxxxx",
  "mc.secret_key" = "SKxxxxx",
  "mc.endpoint" = "xxxxx",
  'mc.enable.namespace.schema' = 'true'
);
```
詳細については[MaxCompute Catalog](../catalogs/maxcompute-catalog.md)のドキュメントを参照してください。

### 02 TPCHデータセットのインポート

MaxComputeのパブリックデータセット内のTPCH 100データセットを例として使用し（データはすでにMaxComputeにインポート済み）、`CREATE TABLE AS SELECT`文を使用してMaxComputeのデータをDorisにインポートします。

このデータセットには7つのテーブルが含まれています。最大のテーブルである`lineitem`は16列、600,037,902行を持ち、約30GBのディスク容量を占有します。

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
16C 64GスペックのBEが1台のDorisクラスターにおいて、上記の操作はシリアルに実行すると約6〜7分かかります。

### 03 Github Event Datasetのインポート

MaxComputeのパブリックデータセットのGithub Event datasetを例として使用し（データは既にMaxComputeにインポート済み）、`CREATE TABLE AS SELECT`文を使ってMaxComputeのデータをDorisにインポートします。

ここでは、`dwd_github_events_odps`テーブルから'2015-01-01'から'2016-01-01'までの365パーティションのデータを選択します。このデータは32列、212,786,803行で、約10GBのディスク容量を占有します。

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
16C 64Gスペックの単一BEを持つDorisクラスタでは、上記の操作に約2分かかります。
