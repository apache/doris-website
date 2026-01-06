---
{
    "title": "在 Hive/Iceberg 上构建 TPC-DS 数据集",
    "language": "zh-CN",
    "description": "Doris 支持通过 Trino Connector 兼容框架，使用 TPCDS Connector 来快速构建 TPCDS 测试集。"
}
---

Doris 支持通过 [Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide) 兼容框架，使用 [TPCDS Connector](https://trino.io/docs/current/connector/tpcds.html) 来快速构建 TPCDS 测试集。

结合 Hive/Iceberg 表的数据写回功能，您可以快速通过 Doris 构建 Doris、Hive、Iceberg 表的 TPCDS 测试数据集。

本文档主要介绍如何部署和使用 TPCDS Connector 构建测试数据集。

:::tip
该功能自 Doris 3.0.0 版本开始支持。
:::

## 编译 TPCDS Connector

> 需要 JDK 17 版本。

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpcds
mvn clean install -DskipTest
```

完成编译后，会在 `trino/plugin/trino-tpcds/target/` 下得到 `trino-tpcds-435/` 目录。

也可以直接下载预编译的 [trino-tpcds-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpcds-435.tar.gz) 并解压。

## 部署 TPCDS Connector

将 `trino-tpcds-435/` 目录放到所有 FE 和 BE 部署路径的 `connectors/` 目录下。（如果没有，可以手动创建）。

```text
├── bin
├── conf
├── connectors
│   ├── trino-tpcds-435
...
```

部署完成后，建议重启 FE、BE 节点以确保 Connector 可以被正确加载。

## 创建 TPCDS Catalog

```sql
CREATE CATALOG `tpcds` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpcds",
    "trino.tpcds.split-count" = "32"
);
```

其中 `tpcds.split-count` 为并发数，建议设置为 BE 单机核数的 2 倍，可以获得最优的并发度。提升数据生成效率。

## 使用 TPCDS Catalog

TPCDS Catalog 中预制了不同 Scale Factor 的 TPCDS 数据集，可以通过 `SHOW DATABASES` 和 `SHOW TABLES` 命令查看。

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

通过 SELECT 语句可以直接查询这些表。

:::tip
这些预制数据集的数据，并没有实际存储，而是在查询时实时生成的。所以这些预制数据集不适合用来直接进行 Benchmark 测试。适用于通过 `INSERT INTO SELECT` 将数据集写入到其他目的表（如 Doris 内表、Hive、Iceberg 等所有 Doris 支持写入的数据源）后，对目的表进行性能测试。
:::

## 构建 TPCDS 测试数据集

以下示例通过 CTAS 语句快速构建一个 Hive 上的 TPCDS 测试数据集：

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
在包含 3 个 16C BE 节点的 Doris 集群上，创建一个 TPCDS 1000 的 Hive 数据集，大约需要 3 到 4 个小时。
:::

