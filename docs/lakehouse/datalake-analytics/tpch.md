---
{
"title": "TPCH",
"language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Usage Notes

TPCH Catalog uses the [Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide) compatibility framework and the [TPCH Connector](https://trino.io/docs/current/connector/tpch.html) to quickly build TPCH test sets.

:::tip
This feature is supported starting from Doris version 3.0.0.
:::

## Compiling the TPCH Connector

> JDK 17 is required.

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpch
mvn clean install -DskipTest
```

After compiling, you will find the `trino-tpch-435/` directory under `trino/plugin/trino-tpch/target/`.

You can also directly download the precompiled [trino-tpch-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpch-435.tar.gz) and extract it.

## Deploying the TPCH Connector

Place the `trino-tpch-435/` directory under the `connectors/` directory in the deployment paths of all FE and BE nodes. (If it does not exist, you can create it manually).

```
├── bin
├── conf
├── connectors
│   ├── trino-tpch-435
...
```

After deployment, it is recommended to restart the FE and BE nodes to ensure the Connector is loaded correctly.

## Creating the TPCH Catalog

```sql
CREATE CATALOG `tpch` PROPERTIES (
    "type" = "trino-connector",
    "connector.name" = "tpch"
    "tpch.splits-per-node" = "32",
);
```

The `tpch.splits-per-node` property sets the level of concurrency. It is recommended to set it to twice the number of cores per BE node to achieve optimal concurrency and improve data generation efficiency.

## Using the TPCH Catalog

The TPCH Catalog includes pre-configured TPCH datasets of different scale factors, which can be viewed using the `SHOW DATABASES` and `SHOW TABLES` commands.

```
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
11 rows in set (0.00 sec)

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
8 rows in set (0.00 sec)
```

You can directly query these tables using the SELECT statement.

:::tip
The data in these pre-configured datasets is not actually stored but generated in real-time during queries. Therefore, these datasets are not suitable for direct benchmarking. They are more appropriate for writing to other target tables (such as Doris internal tables, Hive, Iceberg, and other data sources supported by Doris) via `INSERT INTO SELECT`, after which performance tests can be conducted on the target tables.
:::

### Best Practices

#### Quickly Build TPCH Test Dataset

You can quickly build a TPCH test dataset using the CTAS (Create Table As Select) statement:

```
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
On a Doris cluster with 3 BE nodes, each with 16 cores, creating a TPCH 1000 dataset in Hive takes approximately 25 minutes, and TPCH 10000 takes about 4 to 5 hours.
:::
