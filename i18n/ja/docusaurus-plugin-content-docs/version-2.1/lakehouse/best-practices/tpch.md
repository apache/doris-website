---
{
  "title": "Hive/IcebergでのTPC-H生成",
  "language": "ja",
  "description": "Dorisは、Trino Connector互換フレームワークを使用して、TPCH ConnectorでTPCHテストセットを迅速に構築することをサポートしています。"
}
---
DorisはTrino Connectorと互換性のあるフレームワークを使用して、TPCH ConnectorでTPCHテストセットを迅速に構築することをサポートしています。

Hive/Icebergテーブルのデータ書き戻し機能と組み合わせることで、DorisからDoris、Hive、およびIcebergテーブル向けのTPCHテストデータセットを迅速に構築できます。

この文書では主に、TPCH Connectorをデプロイし、テストデータセットの構築に使用する方法について説明します。

:::tip
この機能はDorisバージョン3.0.0以降でサポートされています。
:::

## TPCH Connectorのコンパイル

> JDKバージョン17が必要です。

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpch
mvn clean install -DskipTests
```
コンパイル後、`trino/plugin/trino-tpch/target/`の下に`trino-tpch-435/`ディレクトリが作成されます。

また、事前にコンパイルされた[trino-tpch-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpch-435.tar.gz)を直接ダウンロードして展開することもできます。

## TPCH Connectorのデプロイ

`trino-tpch-435/`ディレクトリを、すべてのFEとBEのデプロイメントパスの`connectors/`ディレクトリに配置してください。（存在しない場合は手動で作成できます）。

```text
├── bin
├── conf
├── connectors
│   ├── trino-tpch-435
...
```
デプロイ後、Connectorが正しく読み込まれるようにFEとBEノードを再起動することを推奨します。

## TPCH Catalogの作成

```sql
CREATE CATALOG `tpch` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpch",
    "trino.tpch.column-naming" = "STANDARD",
    "trino.tpch.splits-per-node" = "32"
);
```
`tpch.splits-per-node`は並行処理数であり、最適な並行性を実現するためにBEマシンあたりのコア数の2倍に設定することが推奨されます。これによりデータ生成効率が向上します。

`"tpch.column-naming" = "STANDARD"`の場合、TPCHテーブルのカラム名は`l_orderkey`のようにテーブル名の略語で始まり、それ以外の場合は`orderkey`となります。

## TPCH Catalogの使用

TPCH Catalogには異なるScale FactorのTPCHデータセットが事前設定されており、`SHOW DATABASES`および`SHOW TABLES`コマンドを使用して確認できます。

```sql
mysql> SWITCH tpch;
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
+---------------+
| Tables_in_sf1 |
+---------------+
| customer      |
| lineitem      |
| nation        |
| orders        |
| part          |
| partsupp      |
| region        |
| supplier      |
+---------------+
```
これらのテーブルはSELECT文を使用して直接クエリできます。

:::tip
これらの事前設定されたデータセットのデータは実際に格納されているわけではなく、クエリ実行時にリアルタイムで生成されます。そのため、これらの事前設定されたデータセットは直接的なBenchmarkテストには適していません。これらは`INSERT INTO SELECT`を通じて他のターゲットテーブル（Doris内部テーブル、Hive、Iceberg、およびDorisが書き込みをサポートするその他すべてのデータソース）にデータセットを書き込むのに適しており、その後ターゲットテーブルでパフォーマンステストを実行できます。
:::

## TPCHテストデータセットの構築

以下の例では、CTAS文を使用してHive上でTPCHテストデータセットを素早く構築します：

```sql
CREATE TABLE hive.tpch100.customer PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.customer  ;
CREATE TABLE hive.tpch100.lineitem PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.lineitem  ;
CREATE TABLE hive.tpch100.nation   PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.nation    ;
CREATE TABLE hive.tpch100.orders   PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.orders    ;
CREATE TABLE hive.tpch100.part     PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.part      ;
CREATE TABLE hive.tpch100.partsupp PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.partsupp  ;
CREATE TABLE hive.tpch100.region   PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.region    ;
CREATE TABLE hive.tpch100.supplier PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.supplier  ;
```
:::tip
3つの16C BEノードを持つDorisクラスターにおいて、TPCH 1000 Hiveデータセットの作成には約25分かかり、TPCH 10000では約4～5時間かかります。
:::
