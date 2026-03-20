---
{
  "title": "Databricks Unity カタログとの統合",
  "language": "ja",
  "description": "企業がレイクハウスアーキテクチャの下で増大するデータ資産をますます管理するようになるにつれて、クロスプラットフォームで高性能な"
}
---
企業がレイクハウスアーキテクチャの下で増加するデータ資産をますます管理するようになるにつれて、クロスプラットフォーム、高性能、ガバナンスされたデータアクセス機能に対する需要がより緊急になっています。次世代リアルタイム分析データベースであるApache Dorisは、現在[Databricks Unity カタログ](https://www.databricks.com/product/unity-catalog)との深い統合を実現し、企業が統一されたガバナンスフレームワークの下でDatabricksによって管理されるデータレイクに直接アクセスし効率的にクエリできるようにし、シームレスなデータ接続を実現しています。

**このドキュメントを通じて、以下について深く理解できます：**

- Databricks環境セットアップ：DatabricksでExternal Locations、Catalogs、およびIcebergテーブルを作成する方法と、関連する権限設定

- DorisのUnity カタログへの接続：DorisをDatabricks Unity カタログに接続し、Icebergテーブルにアクセスする方法

> 注意：この機能にはDoris バージョン3.1.3以上が必要です。

## Databricks環境セットアップ

### External Locationの作成

Unity カタログにおいて、[External Location](https://docs.databricks.com/aws/en/sql/language-manual/sql-ref-external-locations)は、クラウドオブジェクトストレージ内のパスをStorage Credentialsに関連付ける安全なオブジェクトです。External Locationsは外部アクセスをサポートし、Unity カタログはCredential Vending機能を通じて外部システムに短期認証情報を発行し、外部システムがこれらのパスにアクセスできるようにします。

![unity1](/images/integrations/lakehouse/unity/unity-1.png)

このドキュメントでは、AWS Quickstartを使用してAWS S3にExternal Locationを作成します。

![unity2](/images/integrations/lakehouse/unity/unity-2.png)

作成後、External カタログとその対応するCredentialを確認できます：

![unity3](/images/integrations/lakehouse/unity/unity-3.png)

### カタログの作成

インターフェースでCreate カタログオプションをクリックします。

![unity4](/images/integrations/lakehouse/unity/unity-4.png)

カタログ名を入力します。`Use default storage`のチェックを外し、先ほど作成したExternal Locationを選択します。

![unity5](/images/integrations/lakehouse/unity/unity-5.png)

### External Use Schema権限の有効化

新しく作成した`Catalog`→`Permissions`→`Grant`をクリックします：

![unity6](/images/integrations/lakehouse/unity/unity-6.png)

`All account users`を選択し、`EXTERNAL USE SCHEMA`オプションにチェックを入れます。

![unity7](/images/integrations/lakehouse/unity/unity-7.png)

### Icebergテーブルの作成とデータの挿入

Databricks SQL EditorでIcebergテーブルを作成し、データを挿入するために以下のSQLを実行します：

```sql
CREATE TABLE `my-unity-catalog`.default.iceberg_table (
  id int,
  name string
) USING iceberg;

INSERT INTO `my-unity-catalog`.default.iceberg_table VALUES(1, "jack");
```
### アクセストークンの取得

右上角のユーザーアバターをクリックし、`Settings`ページに移動して、`User` → `Developer`の下にある`Access tokens`を選択します。DorisをUnity Catalogに接続する際の後続の使用のために新しいTokenを作成します。Tokenは`dapi4f...`の形式の文字列です。

## DorisのUnity Catalogへの接続

### Catalogの作成

```sql
-- Use oauth2 credential and vended credentials
CREATE CATALOG dbx_unity_catalog PROPERTIES (
  "uri" = "https://dbc-xx.cloud.databricks.com:443/api/2.1/unity-catalog/iceberg-rest/",
  "type" = "iceberg",
  "warehouse" = "my-unity-catalog",
  "iceberg.catalog.type" = "rest",
  "iceberg.rest.security.type" = "oauth2",
  "iceberg.rest.oauth2.credential" = "clientid:clientsecret",
  "iceberg.rest.oauth2.server-uri" = "https://dbc-xx.cloud.databricks.com:443/oidc/v1/token",
  "iceberg.rest.oauth2.scope" = "all-apis",
  "iceberg.rest.vended-credentials-enabled" = "true"
);

-- Use PAT and vended credentials
CREATE CATALOG dbx_unity_catalog PROPERTIES (
  "uri" = "https://<dbc-account>.cloud.databricks.com/api/2.1/unity-catalog/iceberg-rest/",
  "type" = "iceberg",
  "warehouse" = "my-unity-catalog",
  "iceberg.catalog.type" = "rest",
  "iceberg.rest.security.type" = "oauth2",
  "iceberg.rest.oauth2.token" = "<token>",
  "iceberg.rest.vended-credentials-enabled" = "true"
);

-- Use oauth2 credential and static ak/sk for accessing aws s3
CREATE CATALOG dbx_unity_catalog PROPERTIES (
  "uri" = "https://dbc-xx.cloud.databricks.com:443/api/2.1/unity-catalog/iceberg-rest/",
  "type" = "iceberg",
  "warehouse" = "my-unity-catalog",
  "iceberg.catalog.type" = "rest",
  "iceberg.rest.security.type" = "oauth2",
  "iceberg.rest.oauth2.credential" = "clientid:clientsecret",
  "iceberg.rest.oauth2.server-uri" = "https://dbc-xx.cloud.databricks.com:443/oidc/v1/token",
  "iceberg.rest.oauth2.scope" = "all-apis",
  "s3.endpoint" = "https://s3.<region>.amazonaws.com",
  "s3.access_key" = "<ak>",
  "s3.secret_key" = "<sk>",
  "s3.region" = "<region>"
);
```
### カタログへのアクセス

作成後、Unity Catalogに保存されたIcebergテーブルにアクセスを開始できます：

```sql
mysql> USE dbx_unity_catalog.`default`;
Database changed

mysql> SELECT * FROM iceberg_table;
+------+------+
| id   | name |
+------+------+
|    1 | jack |
+------+------+
1 row in set (3.32 sec)
```
### Iceberg テーブルの管理

Unity Catalog 内の Iceberg テーブルを Doris を通じて直接作成、管理、書き込みすることもできます：

```sql
-- Write to existing table in Unity Catalog
INSERT INTO iceberg_table VALUES(2, "mary");

-- Create a partitioned table
CREATE TABLE partition_table (
  `ts` DATETIME COMMENT 'ts',
  `col1` BOOLEAN COMMENT 'col1',
  `pt1` STRING COMMENT 'pt1',
  `pt2` STRING COMMENT 'pt2'
)
PARTITION BY LIST (day(ts), pt1, pt2) ();

-- Insert data
INSERT INTO partition_table VALUES("2025-11-12", true, "foo", "bar");

-- View table partition information
SELECT * FROM partition_table$partitions\G
*************************** 1. row ***************************
                    partition: {"ts_day":"2025-11-12", "pt1":"foo", "pt2":"bar"}
                      spec_id: 0
                 record_count: 1
                   file_count: 1
total_data_file_size_in_bytes: 2552
 position_delete_record_count: 0
   position_delete_file_count: 0
 equality_delete_record_count: 0
   equality_delete_file_count: 0
              last_updated_at: 2025-11-18 15:20:45.964000
     last_updated_snapshot_id: 9024874735105617773
```
## 概要

Databricks Unity Catalogとのディープインテグレーションにより、Apache Dorisは統一されたガバナンスフレームワークの下で、企業がより高いパフォーマンスと低コストでデータレイク内のコア資産にアクセスし分析することを可能にします。この機能はLakehouseアーキテクチャの全体的な一貫性を向上させるだけでなく、リアルタイム分析、インタラクティブクエリ、AIシナリオに新たな可能性をもたらします。データチーム、分析エンジニア、プラットフォームアーキテクトのいずれであっても、既存のデータレイク基盤の上により俊敏でインテリジェントなデータアプリケーションを構築するためにDorisを活用できます。
