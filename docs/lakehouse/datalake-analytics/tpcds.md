---
{
"title": "TPCDS",
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

TPCDS Catalog uses the [Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide) compatibility framework and the [TPCDS Connector](https://trino.io/docs/current/connector/tpcds.html) to quickly build TPCDS test sets.

:::tip
This feature is supported starting from Doris version 3.0.0.
:::

## Compiling the TPCDS Connector

> JDK 17 is required.

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpcds
mvn clean install -DskipTest
```

After compiling, you will find the `trino-tpcds-435/` directory under `trino/plugin/trino-tpcds/target/`.

You can also directly download the precompiled [trino-tpcds-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpcds-435.tar.gz) and extract it.

## Deploying the TPCDS Connector

Place the `trino-tpcds-435/` directory under the `connectors/` directory in the deployment paths of all FE and BE nodes. (If it does not exist, you can create it manually).

```
├── bin
├── conf
├── connectors
│   ├── trino-tpcds-435
...
```

After deployment, it is recommended to restart the FE and BE nodes to ensure the Connector is loaded correctly.

## Creating the TPCDS Catalog

```sql
CREATE CATALOG `tpcds` PROPERTIES (
    "type" = "trino-connector",
    "connector.name" = "tpcds"
    "tpcds.split-count" = "32"
);
```

The `tpcds.split-count` property sets the level of concurrency. It is recommended to set it to twice the number of cores per BE node to achieve optimal concurrency and improve data generation efficiency.

## Using the TPCDS Catalog

The TPCDS Catalog includes pre-configured TPCDS datasets of different scale factors, which can be viewed using the `SHOW DATABASES` and `SHOW TABLES` commands.

```
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
11 rows in set (0.00 sec)

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
25 rows in set (0.00 sec)
```

You can directly query these tables using the SELECT statement.

:::tip
The data in these pre-configured datasets is not actually stored but generated in real-time during queries. Therefore, these datasets are not suitable for direct benchmarking. They are more appropriate for writing to other target tables (such as Doris internal tables, Hive, Iceberg, and other data sources supported by Doris) via `INSERT INTO SELECT`, after which performance tests can be conducted on the target tables.
:::

### Best Practices

#### Quickly Build TPCDS Test Dataset

You can quickly build a TPCDS test dataset using the CTAS (Create Table As Select) statement:

```
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
On a Doris cluster with 3 BE nodes, each with 16 cores, creating a TPCDS 1000 dataset in Hive takes approximately 3 to 4 hours.
:::

