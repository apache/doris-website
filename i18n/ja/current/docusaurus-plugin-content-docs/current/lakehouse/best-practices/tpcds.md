---
{
  "title": "Hive/IcebergでのTPC-DS生成",
  "language": "ja",
  "description": "DorisはTrino Connector互換フレームワークを通じてTPCDSコネクタを使用し、TPCDSテストセットを迅速に構築することをサポートしています。"
}
---
Dorisは[Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide)互換フレームワークを通じて、[TPCDS Connector](https://trino.io/docs/current/connector/tpcds.html)を使用してTPCDSテストセットを迅速に構築することをサポートしています。

Hive/Icebergテーブルのデータ書き戻し機能と組み合わせることで、Dorisを通じてDoris、Hive、IcebergテーブルのTPCDSテストデータセットを迅速に構築できます。

このドキュメントでは主に、TPCDS Connectorをデプロイしてテストデータセットを構築するために使用する方法を紹介します。

:::tip
この機能はDorisバージョン3.0.0以降でサポートされています。
:::

## TPCDS Connectorのコンパイル

> JDKバージョン17が必要です。

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpcds
mvn clean install -DskipTests
```
コンパイル後、`trino/plugin/trino-tpcds/target/`の下に`trino-tpcds-435/`ディレクトリが生成されます。

事前にコンパイルされた[trino-tpcds-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpcds-435.tar.gz)を直接ダウンロードして展開することもできます。

## TPCDS Connectorのデプロイ

すべてのFEおよびBEデプロイメントパスの`connectors/`ディレクトリの下に`trino-tpcds-435/`ディレクトリを配置してください。（存在しない場合は手動で作成できます）。

```text
├── bin
├── conf
├── connectors
│   ├── trino-tpcds-435
...
```
デプロイ後は、Connectorが正しく読み込まれるように、FEおよびBEノードを再起動することを推奨します。

## TPCDS Catalogの作成

```sql
CREATE CATALOG `tpcds` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpcds",
    "trino.tpcds.split-count" = "32"
);
```
`tpcds.split-count`は並行数であり、最適な並行性を実現するためにBEマシンあたりのコア数の2倍に設定することが推奨されます。データ生成効率を向上させます。

## TPCDS Catalogの使用

TPCDS Catalogには異なるScale Factorの事前構築されたTPCDSデータセットがあり、`SHOW DATABASES`および`SHOW TABLES`コマンドを使用して確認できます。

```sql
mysql> SWITCH tpcds;
Query OK, 0 rows affected (0.00 sec)

mysql> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| sf1                |
| sf100              |
| sf1000             |
| sf10000            |
| sf100000           |
| sf300              |
| sf3000             |
| sf30000            |
| tiny               |
+--------------------+

mysql> USE sf1;
mysql> SHOW TABLES;
+------------------------+
| Tables_in_sf1          |
+------------------------+
| call_center            |
| catalog_page           |
| catalog_returns        |
| catalog_sales          |
| customer               |
| customer_address       |
| customer_demographics  |
| date_dim               |
| dbgen_version          |
| household_demographics |
| income_band            |
| inventory              |
| item                   |
| promotion              |
| reason                 |
| ship_mode              |
| store                  |
| store_returns          |
| store_sales            |
| time_dim               |
| warehouse              |
| web_page               |
| web_returns            |
| web_sales              |
| web_site               |
+------------------------+
```
SELECT文を使用してこれらのテーブルを直接クエリできます。

:::tip
これらの事前構築されたデータセットのデータは実際には保存されておらず、クエリ中にリアルタイムで生成されます。そのため、これらの事前構築されたデータセットは直接のBenchmarkテストには適していません。`INSERT INTO SELECT`を通じてこれらのデータセットを他のターゲットテーブル（Doris内部テーブル、Hive、Iceberg、およびDorisが書き込みをサポートするその他のデータソース）に書き込み、その後ターゲットテーブルでパフォーマンステストを実行するのに適しています。
:::

## TPCDSテストデータセットの構築

以下の例では、CTAS文を使用してHive上でTPCDSテストデータセットを迅速に構築します：

```sql
CREATE TABLE hive.tpcds100.call_center            PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.call_center           ;
CREATE TABLE hive.tpcds100.catalog_page           PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.catalog_page          ;
CREATE TABLE hive.tpcds100.catalog_returns        PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.catalog_returns       ;
CREATE TABLE hive.tpcds100.catalog_sales          PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.catalog_sales         ;
CREATE TABLE hive.tpcds100.customer               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.customer              ;
CREATE TABLE hive.tpcds100.customer_address       PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.customer_address      ;
CREATE TABLE hive.tpcds100.customer_demographics  PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.customer_demographics ;
CREATE TABLE hive.tpcds100.date_dim               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.date_dim              ;
CREATE TABLE hive.tpcds100.dbgen_version          PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.dbgen_version         ;
CREATE TABLE hive.tpcds100.household_demographics PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.household_demographics;
CREATE TABLE hive.tpcds100.income_band            PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.income_band           ;
CREATE TABLE hive.tpcds100.inventory              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.inventory             ;
CREATE TABLE hive.tpcds100.item                   PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.item                  ;
CREATE TABLE hive.tpcds100.promotion              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.promotion             ;
CREATE TABLE hive.tpcds100.reason                 PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.reason                ;
CREATE TABLE hive.tpcds100.ship_mode              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.ship_mode             ;
CREATE TABLE hive.tpcds100.store                  PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.store                 ;
CREATE TABLE hive.tpcds100.store_returns          PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.store_returns         ;
CREATE TABLE hive.tpcds100.store_sales            PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.store_sales           ;
CREATE TABLE hive.tpcds100.time_dim               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.time_dim              ;
CREATE TABLE hive.tpcds100.warehouse              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.warehouse             ;
CREATE TABLE hive.tpcds100.web_page               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.web_page              ;
CREATE TABLE hive.tpcds100.web_returns            PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.web_returns           ;
CREATE TABLE hive.tpcds100.web_sales              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.web_sales             ;
CREATE TABLE hive.tpcds100.web_site               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.web_site              ;
```
:::tip
3つの16C BEノードを持つDorisクラスターでは、TPCDS 1000 Hiveデータセットの作成には約3～4時間かかります。
:::
