---
{
"title": "TPCH
"language": "zh-CN"
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

## 使用须知

TPCH Catalog 通过 Trino Connector 兼容框架，使用 [TPCH Connector](https://trino.io/docs/current/connector/tpch.html) 来快速构建 TPCH 测试集。

:::tip
该功能自 Doris 3.0.0 版本开始支持
:::

## 编译 TPCH Connector

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpch
mvn clean install -DskipTest
```

完成编译后，会在 `trino/plugin/trino-tpch/target/` 下得到 `trino-tpch-435/` 目录

## 部署 TPCH Connector

将 `trino-tpch-435/` 目录放到所有 FE 和 BE 部署路径的 `connectors/` 目录下。（如果没有，可以手动创建）。

```
├── bin
├── conf
├── connectors
│   ├── trino-tpch-435
...
```

部署完成后，建议重启 FE、BE 节点以确保 Connector 可以被正确加载

## 创建 TPCH Catalog

```sql
CREATE CATALOG `tpch` PROPERTIES (
    "type" = "trino-connector",
    "connector.name" = "tpch"
    "tpch.splits-per-node" = "32",
);
```

其中 `tpch.splits-per-node` 为并发数，建议设置为 BE 单机核数的 2 倍，可以获得最优的并发度。提升数据生成效率。

## 使用 TPCH Catalog

TPCH Catalog 中预制了不同 Scale Factor 的 TPCH 数据集，可以通过 `SHOW DATABASES` 和 `SHOW TABLES` 命令查看。

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

通过 SELECT 语句可以直接查询这些表。

:::tips
这些预制数据集的数据，并没有实际存储，而是在查询时实时生成的。所以这些预制数据集不适合用来直接进行 Benchmark 测试。适用于通过 `INSERT INTO SELECT` 将数据集写入到其他目的表（如 Doris 内表、Hive、Iceberg 等所有 Doris 支持写入的数据源）后，对目的表进行性能测试。
:::

### 最佳实践

#### 快速构建 TPCH 测试数据集

可以通过 CTAS 语句快速构建一个 TPCH 测试数据集：

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

:::tips
在包含 3 个 16C BE 节点的 Doris 集群上，创建一个 TPCH 1000 的 Hive 数据集，大约需要 25 分钟，TPCH 10000 大约需要 4 到 5 个小时。
:::









