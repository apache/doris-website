---
{
    "title": "Generating TPC-H on Hive/Iceberg",
    "language": "en",
    "description": "Doris supports using the Trino Connector compatible framework to quickly build TPCH test sets with the TPCH Connector."
}
---

Doris supports using the [Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide) compatible framework to quickly build TPCH test sets with the [TPCH Connector](https://trino.io/docs/current/connector/tpch.html).

By combining the data write-back function of Hive/Iceberg tables, you can quickly build TPCH test datasets for Doris, Hive, and Iceberg tables through Doris.

This document mainly introduces how to deploy and use the TPCH Connector to build test datasets.

:::tip
This feature is supported starting from Doris version 3.0.0.
:::

## Compile TPCH Connector

> Requires JDK version 17.

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpch
mvn clean install -DskipTest
```

After compilation, you will get the `trino-tpch-435/` directory under `trino/plugin/trino-tpch/target/`.

You can also directly download the precompiled [trino-tpch-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpch-435.tar.gz) and extract it.

## Deploy TPCH Connector

Place the `trino-tpch-435/` directory into the `connectors/` directory of all FE and BE deployment paths. (If not present, you can create it manually).

```text
├── bin
├── conf
├── connectors
│   ├── trino-tpch-435
...
```

After deployment, it is recommended to restart the FE and BE nodes to ensure the Connector can be loaded correctly.

## Create TPCH Catalog

```sql
CREATE CATALOG `tpch` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpch",
    "trino.tpch.column-naming" = "STANDARD",
    "trino.tpch.splits-per-node" = "32"
);
```

The `tpch.splits-per-node` is the concurrency number, which is recommended to be set to 2 times the number of cores per BE machine to achieve optimal concurrency. This improves data generation efficiency.

When `"tpch.column-naming" = "STANDARD"`, the column names in the TPCH table will start with the table name abbreviation, such as `l_orderkey`, otherwise, it is `orderkey`.

## Use TPCH Catalog

The TPCH Catalog has pre-configured TPCH datasets of different Scale Factors, which can be viewed using the `SHOW DATABASES` and `SHOW TABLES` commands.

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

You can directly query these tables using the SELECT statement.

:::tip
The data in these pre-configured datasets is not actually stored but is generated in real-time during queries. Therefore, these pre-configured datasets are not suitable for direct Benchmark testing. They are suitable for writing datasets into other target tables (such as Doris internal tables, Hive, Iceberg, and all other data sources that Doris supports writing to) through `INSERT INTO SELECT`, and then performing performance testing on the target tables.
:::

## Build TPCH Test Dataset

The following example quickly builds a TPCH test dataset on Hive using the CTAS statement:

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
In a Doris cluster with 3 16C BE nodes, creating a TPCH 1000 Hive dataset takes about 25 minutes, and TPCH 10000 takes about 4 to 5 hours.
:::

