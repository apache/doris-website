---
{
    "title": "Databricks Unity Catalog との統合",
    "language": "ja",
    "description": "レイクハウスアーキテクチャで増大するデータ資産を管理する企業向けに、Apache Doris と Databricks Unity Catalog の統合方法を説明します。"
}
---

レイクハウスアーキテクチャの下で企業が管理するデータ資産が増えるにつれ、プラットフォームをまたいで高性能かつガバナンスの効いたデータアクセスを実現することが、ますます重要になっています。次世代のリアルタイム分析データベースである Apache Doris は、[Databricks Unity Catalog](https://www.databricks.com/product/unity-catalog) と深く統合されています。これにより、企業は統一されたガバナンスの枠組みの下で、Databricks が管理するデータレイクに直接アクセスして効率的にクエリを実行し、シームレスにデータを連携できます。

**このドキュメントでは、以下について詳しく説明します。**

- Databricks 環境のセットアップ：Databricks での外部ロケーション、カタログ、Iceberg テーブルの作成方法と、関連する権限の設定方法

- Doris から Unity Catalog への接続：Doris を Databricks Unity Catalog に接続し、Iceberg テーブルにアクセスする方法

> 注意：この機能には Doris 3.1.3 以降が必要です。

## Databricks 環境のセットアップ

### 外部ロケーションの作成

Unity Catalog の[外部ロケーション](https://docs.databricks.com/aws/en/sql/language-manual/sql-ref-external-locations)は、クラウドオブジェクトストレージ内のパスとストレージ認証情報を関連付けるセキュリティ保護されたオブジェクトです。外部ロケーションは外部からのアクセスをサポートします。Unity Catalog は Credential Vending 機能を通じて外部システムに短期の認証情報を発行でき、外部システムはその認証情報を使って該当するパスにアクセスできます。

![Databricks のカタログ画面にある外部ロケーションの作成メニュー](/images/integrations/lakehouse/unity/unity-1.png)

このドキュメントでは、AWS Quickstart を使用して AWS S3 に外部ロケーションを作成します。

![外部ロケーション作成画面の AWS Quickstart オプション](/images/integrations/lakehouse/unity/unity-2.png)

作成後、外部ロケーションとそれに対応する認証情報を確認できます。

![作成した外部ロケーションと対応する認証情報](/images/integrations/lakehouse/unity/unity-3.png)

### カタログの作成

画面の「Create a catalog」をクリックします。

![Databricks のカタログ作成メニュー](/images/integrations/lakehouse/unity/unity-4.png)

カタログ名を入力します。`Use default storage` のチェックを外し、先ほど作成した外部ロケーションを選択します。

![カタログ名と外部ロケーションの設定画面](/images/integrations/lakehouse/unity/unity-5.png)

### EXTERNAL USE SCHEMA 権限の付与

新しく作成した `Catalog` をクリックし、`Permissions` → `Grant` の順に選択します。

![カタログの Permissions 画面にある Grant ボタン](/images/integrations/lakehouse/unity/unity-6.png)

`All account users` を選択し、`EXTERNAL USE SCHEMA` にチェックを入れます。

![All account users に対する EXTERNAL USE SCHEMA 権限の選択画面](/images/integrations/lakehouse/unity/unity-7.png)

### Iceberg テーブルの作成とデータの挿入

Databricks SQL Editor で以下の SQL を実行し、Iceberg テーブルを作成してデータを挿入します。

```sql
CREATE TABLE `my-unity-catalog`.default.iceberg_table (
  id int,
  name string
) USING iceberg;

INSERT INTO `my-unity-catalog`.default.iceberg_table VALUES(1, "jack");
```

### アクセストークンの取得

右上のユーザーアバターをクリックして `Settings` ページを開き、`Access tokens` を `User` → `Developer` の下から選択します。Doris から Unity Catalog に接続するときに使用する新しいトークンを作成します。トークンは `dapi4f...` のような形式の文字列です。

## Doris から Unity Catalog への接続

### カタログの作成

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

作成後、Unity Catalog に保存されている Iceberg テーブルにアクセスできます。

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

Doris から Unity Catalog 内の Iceberg テーブルを直接作成、管理し、データを書き込むこともできます。

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

## まとめ

Apache Doris は Databricks Unity Catalog と深く統合することで、企業が統一されたガバナンスの枠組みの下で、データレイク内の主要なデータ資産により高い性能と低いコストでアクセスし、分析できるようにします。この機能はレイクハウスアーキテクチャ全体の一貫性を高めるとともに、リアルタイム分析、対話型クエリ、AI のユースケースにも新たな可能性をもたらします。データチーム、分析エンジニア、プラットフォームアーキテクトは、既存のデータレイクを基盤として Doris を活用し、より俊敏でインテリジェントなデータアプリケーションを構築できます。
