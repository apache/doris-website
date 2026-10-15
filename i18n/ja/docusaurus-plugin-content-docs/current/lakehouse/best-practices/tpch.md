---
{
    "title": "Hive/Iceberg 上で TPC-H データセットを生成する",
    "language": "ja",
    "description": "Doris では、Trino Connector 互換フレームワークと TPCH Connector を使用して、TPCH テスト用データセットを迅速に構築できます。"
}
---

Doris では、[Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide) 互換フレームワークと [TPCH Connector](https://trino.io/docs/current/connector/tpch.html) を使用して、TPCH テスト用データセットを迅速に構築できます。

Hive/Iceberg テーブルへのデータ書き戻し機能と組み合わせることで、Doris を介して Doris、Hive、Iceberg の各テーブルに TPCH テスト用データセットを迅速に構築できます。

このドキュメントでは、テスト用データセットを構築するための TPCH Connector のデプロイ方法と使用方法を主に説明します。

:::tip
この機能は Doris 3.0.0 以降でサポートされます。
:::

## TPCH Connector のコンパイル

> JDK 17 が必要です。

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpch
mvn clean install -DskipTests
```

コンパイル後、`trino-tpch-435/` ディレクトリが `trino/plugin/trino-tpch/target/` の下に生成されます。

コンパイル済みの [trino-tpch-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpch-435.tar.gz) を直接ダウンロードして展開することもできます。

## TPCH Connector のデプロイ

`trino-tpch-435/` ディレクトリを、すべての FE と BE のデプロイ先にある `connectors/` ディレクトリに配置します（存在しない場合は手動で作成できます）。

```text
├── bin
├── conf
├── connectors
│   ├── trino-tpch-435
...
```

デプロイ後、Connector が正しく読み込まれるように、FE ノードと BE ノードを再起動することを推奨します。

## TPCH Catalog の作成

```sql
CREATE CATALOG `tpch` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpch",
    "trino.tpch.column-naming" = "STANDARD",
    "trino.tpch.splits-per-node" = "32"
);
```

`tpch.splits-per-node` は並列実行数です。データ生成の効率を高めるには、BE マシンごとのコア数の 2 倍に設定することを推奨します。

`"tpch.column-naming" = "STANDARD"` の場合、TPCH テーブルの列名は `l_orderkey` のようにテーブル名の略称で始まります。それ以外の場合は `orderkey` のようになります。

## TPCH Catalog の使用

TPCH Catalog には、異なるスケールファクターの TPCH データセットがあらかじめ用意されています。`SHOW DATABASES` と `SHOW TABLES` コマンドで確認できます。

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

これらのテーブルは、SELECT 文で直接クエリできます。

:::tip
あらかじめ用意されたデータセットのデータは実際には保存されず、クエリ時にリアルタイムで生成されます。そのため、これらのデータセットは直接ベンチマークテストに使用するには適していません。`INSERT INTO SELECT` を使用して別の対象テーブル（Doris の内部テーブル、Hive、Iceberg、その他 Doris が書き込みをサポートするデータソースなど）にデータを書き込んでから、その対象テーブルで性能テストを行う用途に適しています。
:::

## TPCH テスト用データセットの構築

次の例では、CTAS 文を使用して Hive 上に TPCH テスト用データセットを迅速に構築します。

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
16 コアの BE ノードが 3 台ある Doris クラスターでは、TPCH 1000 の Hive データセットの作成に約 25 分、TPCH 10000 の作成に約 4～5 時間かかります。
:::
