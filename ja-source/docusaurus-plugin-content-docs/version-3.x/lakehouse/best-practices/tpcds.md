---
{
  "title": "Hive/IcebergでのTPC-DS生成",
  "description": "DorisはTrino Connector互換フレームワークを通じて、TPCDS Connectorを使用してTPCDSテストセットを迅速に構築することをサポートしています。",
  "language": "ja"
}
---
Dorisは[Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide)互換フレームワークを通じて[TPCDS Connector](https://trino.io/docs/current/connector/tpcds.html)を使用してTPCDSテストセットを素早く構築することをサポートしています。

Hive/IcebergTableのデータライトバック機能と組み合わせることで、DorisからDoris、Hive、IcebergTableのTPCDSテストデータセットを素早く構築できます。

このドキュメントでは主にTPCDS Connectorをデプロイしてテストデータセットを構築するために使用する方法について紹介します。

:::tip
この機能はDorisバージョン3.0.0以降でサポートされています。
:::

## TPCDS Connectorのコンパイル

> JDKバージョン17が必要です。

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpcds
mvn clean install -DskipTest
```
コンパイル後、`trino/plugin/trino-tpcds/target/`の下に`trino-tpcds-435/`ディレクトリが作成されます。

また、事前にコンパイルされた[trino-tpcds-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpcds-435.tar.gz)を直接ダウンロードして展開することもできます。

## TPCDS Connectorのデプロイ

すべてのFEとBEのデプロイパスの`connectors/`ディレクトリの下に`trino-tpcds-435/`ディレクトリを配置します。（存在しない場合は手動で作成できます）。

```text
├── bin
├── conf
├── connectors
│   ├── trino-tpcds-435
...
```
デプロイ後、Connectorが正しくロードされることを確実にするため、FEとBEノードを再起動することを推奨します。

## TPCDS Catalogの作成

```sql
CREATE CATALOG `tpcds` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpcds",
    "trino.tpcds.split-count" = "32"
);
```
`tpcds.split-count`は並行処理数であり、最適な並行処理を実現するためにBEマシン1台あたりのコア数の2倍に設定することが推奨されます。データ生成効率を向上させます。

## TPCDS Catalogの使用

TPCDS Catalogには、異なるScale Factorの事前構築されたTPCDSデータセットがあり、`SHOW DATABASES`および`SHOW TABLES`コマンドを使用して表示できます。

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
SELECT文を使用してこれらのTableを直接クエリできます。

:::tip
これらの事前構築済みデータセットのデータは実際には保存されておらず、クエリの実行時にリアルタイムで生成されます。そのため、これらの事前構築済みデータセットは直接的なBenchmarkテストには適していません。`INSERT INTO SELECT`を通じて他のターゲットTable（Dorisの内部Table、Hive、Iceberg、その他Dorisが書き込みをサポートするデータソースなど）にデータセットを書き込み、その後ターゲットTableでパフォーマンステストを実行するのに適しています。
:::

## TPCDSテストデータセットの構築

以下の例では、CTAS文を使用してHive上にTPCDSテストデータセットを迅速に構築します：

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
3台の16C BEノードを持つDorisクラスターにおいて、TPCDS 1000 Hiveデータセットの作成には約3〜4時間かかります。
:::
