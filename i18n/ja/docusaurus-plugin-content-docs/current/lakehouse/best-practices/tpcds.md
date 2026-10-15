---
{
    "title": "Hive/Iceberg で TPC-DS を生成する",
    "language": "ja",
    "description": "Doris では、Trino Connector 互換フレームワークを介して TPCDS Connector を使用し、TPCDS テスト用データセットをすばやく構築できます。"
}
---

Doris では、[TPCDS Connector](https://trino.io/docs/current/connector/tpcds.html) を [Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide) 互換フレームワークを介して使用し、TPCDS テスト用データセットをすばやく構築できます。

Hive/Iceberg テーブルへのデータ書き戻し機能と組み合わせることで、Doris、Hive、Iceberg の各テーブル向けの TPCDS テスト用データセットを Doris からすばやく構築できます。

このドキュメントでは、主に TPCDS Connector をデプロイして使用し、テスト用データセットを構築する方法を説明します。

:::tip
この機能は Doris バージョン 3.0.0 以降でサポートされています。
:::

## TPCDS Connector のコンパイル

> JDK 17 が必要です。

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpcds
mvn clean install -DskipTests
```

コンパイル後、`trino-tpcds-435/` ディレクトリが `trino/plugin/trino-tpcds/target/` の下に生成されます。

コンパイル済みの [trino-tpcds-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpcds-435.tar.gz) を直接ダウンロードして展開することもできます。

## TPCDS Connector のデプロイ

すべての FE および BE のデプロイ先で、`trino-tpcds-435/` ディレクトリを `connectors/` ディレクトリの下に配置します。配置先ディレクトリが存在しない場合は、手動で作成できます。

```text
├── bin
├── conf
├── connectors
│   ├── trino-tpcds-435
...
```

デプロイ後は、Connector が正しく読み込まれるように FE ノードと BE ノードを再起動することを推奨します。

## TPCDS Catalog の作成

```sql
CREATE CATALOG `tpcds` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpcds",
    "trino.tpcds.split-count" = "32"
);
```

`tpcds.split-count` は並列実行数です。最適な並列度でデータ生成の効率を高めるため、BE マシンあたりのコア数の 2 倍に設定することを推奨します。

## TPCDS Catalog の使用

TPCDS Catalog には、スケールファクターの異なる TPCDS データセットがあらかじめ用意されています。`SHOW DATABASES` コマンドと `SHOW TABLES` コマンドで確認できます。

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

これらのテーブルは、SELECT 文を使用して直接クエリできます。

:::tip
あらかじめ用意されたデータセットのデータは実際には保存されておらず、クエリ時にリアルタイムで生成されます。そのため、これらのデータセットを直接ベンチマークテストに使用することは適していません。`INSERT INTO SELECT` を使用して、Doris の内部テーブルや Hive、Iceberg など、Doris から書き込み可能なデータソースの対象テーブルにデータセットを書き込んだ後、その対象テーブルで性能テストを行う用途に適しています。
:::

## TPCDS テスト用データセットの構築

次の例では、CTAS 文を使用して Hive 上に TPCDS テスト用データセットをすばやく構築します。

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
16 コアの BE ノードが 3 台ある Doris クラスターでは、TPCDS 1000 の Hive データセットの作成に約 3～4 時間かかります。
:::
