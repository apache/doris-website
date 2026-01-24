---
{
    "title": "在 Hive/Iceberg 上构建 TPC-H 数据集",
    "language": "zh-CN",
    "description": "Doris 支持通过 Trino Connector 兼容框架，使用 TPCH Connector 来快速构建 TPCH 测试集。"
}
---

Doris 支持通过 [Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide) 兼容框架，使用 [TPCH Connector](https://trino.io/docs/current/connector/tpch.html) 来快速构建 TPCH 测试集。

结合 Hive/Iceberg 表的数据写回功能，您可以快速通过 Doris 构建 Doris、Hive、Iceberg 表的 TPCH 测试数据集。

本文档主要介绍如何部署和使用 TPCH Connector 构建测试数据集。

:::tip
该功能自 Doris 3.0.0 版本开始支持。
:::

## 编译 TPCH Connector

> 需要 JDK 17 版本。

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpch
mvn clean install -DskipTest
```

完成编译后，会在 `trino/plugin/trino-tpch/target/` 下得到 `trino-tpch-435/` 目录。

也可以直接下载预编译的 [trino-tpch-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpch-435.tar.gz) 并解压。

## 部署 TPCH Connector

将 `trino-tpch-435/` 目录放到所有 FE 和 BE 部署路径的 `connectors/` 目录下。（如果没有，可以手动创建）。

```text
├── bin
├── conf
├── connectors
│   ├── trino-tpch-435
...
```

部署完成后，建议重启 FE、BE 节点以确保 Connector 可以被正确加载。

## 创建 TPCH Catalog

```sql
CREATE CATALOG `tpch` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpch",
    "trino.tpch.column-naming" = "STANDARD",
    "trino.tpch.splits-per-node" = "32"
);
```

其中 `tpch.splits-per-node` 为并发数，建议设置为 BE 单机核数的 2 倍，可以获得最优的并发度。提升数据生成效率。

`"tpch.column-naming" = "STANDARD"` 时，TPCH 表中的列名，都会以表名缩写开头，比如 `l_orderkey`，否则，是 `orderkey`。

## 使用 TPCH Catalog

TPCH Catalog 中预制了不同 Scale Factor 的 TPCH 数据集，可以通过 `SHOW DATABASES` 和 `SHOW TABLES` 命令查看。

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

通过 SELECT 语句可以直接查询这些表。

:::tip
这些预制数据集的数据，并没有实际存储，而是在查询时实时生成的。所以这些预制数据集不适合用来直接进行 Benchmark 测试。适用于通过 `INSERT INTO SELECT` 将数据集写入到其他目的表（如 Doris 内表、Hive、Iceberg 等所有 Doris 支持写入的数据源）后，对目的表进行性能测试。
:::

## 构建 TPCH 测试数据集

以下示例通过 CTAS 语句快速构建一个 Hive 上的 TPCH 测试数据集：

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
在包含 3 个 16C BE 节点的 Doris 集群上，创建一个 TPCH 1000 的 Hive 数据集，大约需要 25 分钟，TPCH 10000 大约需要 4 到 5 个小时。
:::

