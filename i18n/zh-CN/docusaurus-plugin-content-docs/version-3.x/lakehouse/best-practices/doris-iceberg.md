---
{
    "title": "使用 Doris 和 Iceberg",
    "language": "zh-CN",
    "description": "作为一种全新的开放式的数据管理架构，湖仓一体（Data Lakehouse）融合了数据仓库的高性能、实时性以及数据湖的低成本、灵活性等优势，帮助用户更加便捷地满足各种数据处理分析的需求，在企业的大数据体系中已经得到越来越多的应用。"
}
---

作为一种全新的开放式的数据管理架构，湖仓一体（Data Lakehouse）融合了数据仓库的高性能、实时性以及数据湖的低成本、灵活性等优势，帮助用户更加便捷地满足各种数据处理分析的需求，在企业的大数据体系中已经得到越来越多的应用。

在过去多个版本中，Apache Doris 持续加深与数据湖的融合，当前已演进出一套成熟的湖仓一体解决方案。

- 自 0.15 版本起，Apache Doris 引入 Hive 和 Iceberg 外部表，尝试在 Apache Iceberg 之上探索与数据湖的能力结合。
- 自 1.2 版本起，Apache Doris 正式引入 Multi-Catalog 功能，实现了多种数据源的自动元数据映射和数据访问、并对外部数据读取和查询执行等方面做了诸多性能优化，完全具备了构建极速易用 Lakehouse 架构的能力。
- 在 2.1 版本中，Apache Doris 湖仓一体架构得到全面加强，不仅增强了主流数据湖格式（Hudi、Iceberg、Paimon 等）的读取和写入能力，还引入了多 SQL 方言兼容、可从原有系统无缝切换至 Apache Doris。在数据科学及大规模数据读取场景上，Doris 集成了 Arrow Flight 高速读取接口，使得数据传输效率实现 100 倍的提升。

![使用 Doris 和 Iceberg 构建 Lakehouse](/images/lakehouse-architecture-for-doris-and-iceberg.png)

## Apache Doris & Iceberg

Apache Iceberg 是一种开源、高性能、高可靠的数据湖表格式，可实现超大规模数据的分析与管理。它支持 Apache Doris 在内的多种主流查询引擎，兼容 HDFS 以及各种对象云存储，具备 ACID、Schema 演进、高级过滤、隐藏分区和分区布局演进等特性，可确保高性能查询以及数据的可靠性及一致性，其时间旅行和版本回滚功能也为数据管理带来较高的灵活性。

Apache Doris 对 Iceberg 多项核心特性提供了原生支持：

- 支持 Hive Metastore、Hadoop、REST、Glue、Google Dataproc Metastore、DLF 等多种 Iceberg Catalog 类型。
- 原生支持 Iceberg V1/V2 表格式，以及  Position Delete、Equality Delete 文件的读取。
- 支持通过表函数查询 Iceberg 表快照历史。
- 支持时间旅行（Time Travel）功能。
- 原生支持 Iceberg 表引擎。可以通过 Apache Doris 直接创建、管理以及将数据写入到 Iceberg 表。支持完善的分区 Transform 函数，从而提供隐藏分区和分区布局演进等能力。

用户可以基于 Apache Doris + Apache Iceberg 快速构建高效的湖仓一体解决方案，以灵活应对实时数据分析与处理的各种需求：

- 通过 Doris 高性能查询引擎对 Iceberg 表数据和其他数据源进行关联数据分析，构建**统一的联邦数据分析平台**。
- 通过 Doris 直接管理和构建 Iceberg 表，在 Doris 中完成对数据的清洗、加工并写入到 Iceberg 表，构建**统一的湖仓数据处理平台**。
- 通过 Iceberg 表引擎，将 Doris 数据共享给其他上下游系统做进一步处理，构建**统一的开放数据存储平台**。

未来，Apache Iceberg 将作为 Apache Doris 的原生表引擎之一，提供更加完善的湖格式数据的分析、管理功能。Apache Doris 也将逐步支持包括 Update/Delete/Merge、写回时排序、增量数据读取、元数据管理等 Apache Iceberg 更多高级特性，共同构建统一、高性能、实时的湖仓平台。

关于更多说明，请参阅 [Iceberg Catalog](../catalogs/iceberg-catalog)

## 使用指南

本文档主要讲解如何在 Docker 环境下快速搭建 Apache Doris + Apache Iceberg 测试 & 演示环境，并展示各功能的使用操作。

本文涉及所有脚本和代码可以从该地址获取：[https://github.com/apache/doris/tree/master/samples/datalake/iceberg_and_paimon](https://github.com/apache/doris/tree/master/samples/datalake/iceberg_and_paimon)

### 01 环境准备

本文示例采用 Docker Compose 部署，组件及版本号如下：

| 组件名称 | 版本 |
| --- | --- |
| Apache Doris | 默认 2.1.5，可修改 |
| Apache Iceberg | 1.4.3|
| MinIO | RELEASE.2024-04-29T09-56-05Z|

### 02 环境部署

1. 启动所有组件

	`bash ./start_all.sh`

2. 启动后，可以使用如下脚本，登陆 Doris 命令行：
	
	```sql
	-- login doris
	bash ./start_doris_client.sh
	```

### 03 创建 Iceberg 表

首先登陆 Doris 命令行后，Doris 集群中已经创建了名为 Iceberg 的 Catalog（可通过 `SHOW CATALOGS`/`SHOW CREATE CATALOG iceberg` 查看）。以下为该 Catalog 的创建语句：

```sql
-- 已创建，无需执行
CREATE CATALOG `iceberg` PROPERTIES (
    "type" = "iceberg",
    "iceberg.catalog.type" = "rest",
    "warehouse" = "s3://warehouse/",
    "uri" = "http://rest:8181",
    "s3.access_key" = "admin",
    "s3.secret_key" = "password",
    "s3.endpoint" = "http://minio:9000"
);
```

在 Iceberg Catalog 创建数据库和 Iceberg 表：

```sql
mysql> SWITCH iceberg;
Query OK, 0 rows affected (0.00 sec)

mysql> CREATE DATABASE nyc;
Query OK, 0 rows affected (0.12 sec)

mysql> CREATE TABLE iceberg.nyc.taxis
       (
           vendor_id BIGINT,
           trip_id BIGINT,
           trip_distance FLOAT,
           fare_amount DOUBLE,
           store_and_fwd_flag STRING,
           ts DATETIME
       )
       PARTITION BY LIST (vendor_id, DAY(ts)) ()
       PROPERTIES (
           "compression-codec" = "zstd",
           "write-format" = "parquet"
       );
Query OK, 0 rows affected (0.15 sec)
```

### 04 数据写入

向 Iceberg 表中插入数据：

```sql
mysql> INSERT INTO iceberg.nyc.taxis
       VALUES
        (1, 1000371, 1.8, 15.32, 'N', '2024-01-01 9:15:23'),
        (2, 1000372, 2.5, 22.15, 'N', '2024-01-02 12:10:11'),
        (2, 1000373, 0.9, 9.01, 'N', '2024-01-01 3:25:15'),
        (1, 1000374, 8.4, 42.13, 'Y', '2024-01-03 7:12:33');
Query OK, 4 rows affected (1.61 sec)
{'status':'COMMITTED', 'txnId':'10085'}
```

通过 `CREATE TABLE AS SELECT` 来创建一张 Iceberg 表：

```
mysql> CREATE TABLE iceberg.nyc.taxis2 AS SELECT * FROM iceberg.nyc.taxis;
Query OK, 6 rows affected (0.25 sec)
{'status':'COMMITTED', 'txnId':'10088'}
```

### 05 数据查询

- 简单查询

	```sql
	mysql> SELECT * FROM iceberg.nyc.taxis;
	+-----------+---------+---------------+-------------+--------------------+----------------------------+
	| vendor_id | trip_id | trip_distance | fare_amount | store_and_fwd_flag | ts                         |
	+-----------+---------+---------------+-------------+--------------------+----------------------------+
	|         1 | 1000374 |           8.4 |       42.13 | Y                  | 2024-01-03 07:12:33.000000 |
	|         1 | 1000371 |           1.8 |       15.32 | N                  | 2024-01-01 09:15:23.000000 |
	|         2 | 1000373 |           0.9 |        9.01 | N                  | 2024-01-01 03:25:15.000000 |
	|         2 | 1000372 |           2.5 |       22.15 | N                  | 2024-01-02 12:10:11.000000 |
	+-----------+---------+---------------+-------------+--------------------+----------------------------+
	4 rows in set (0.37 sec)
	
	mysql> SELECT * FROM iceberg.nyc.taxis2;
	+-----------+---------+---------------+-------------+--------------------+----------------------------+
	| vendor_id | trip_id | trip_distance | fare_amount | store_and_fwd_flag | ts                         |
	+-----------+---------+---------------+-------------+--------------------+----------------------------+
	|         1 | 1000374 |           8.4 |       42.13 | Y                  | 2024-01-03 07:12:33.000000 |
	|         1 | 1000371 |           1.8 |       15.32 | N                  | 2024-01-01 09:15:23.000000 |
	|         2 | 1000373 |           0.9 |        9.01 | N                  | 2024-01-01 03:25:15.000000 |
	|         2 | 1000372 |           2.5 |       22.15 | N                  | 2024-01-02 12:10:11.000000 |
	+-----------+---------+---------------+-------------+--------------------+----------------------------+
	4 rows in set (0.35 sec)
	```

- 分区剪裁

	```sql
	mysql> SELECT * FROM iceberg.nyc.taxis where vendor_id = 2 and ts >= '2024-01-01' and ts < '2024-01-02';
	+-----------+---------+---------------+-------------+--------------------+----------------------------+
	| vendor_id | trip_id | trip_distance | fare_amount | store_and_fwd_flag | ts                         |
	+-----------+---------+---------------+-------------+--------------------+----------------------------+
	|         2 | 1000373 |           0.9 |        9.01 | N                  | 2024-01-01 03:25:15.000000 |
	+-----------+---------+---------------+-------------+--------------------+----------------------------+
	1 row in set (0.06 sec)
	
	mysql> EXPLAIN VERBOSE SELECT * FROM iceberg.nyc.taxis where vendor_id = 2 and ts >= '2024-01-01' and ts < '2024-01-02';
	                                                                                                                                                             
	....                                                                                                                                                                                  
	|   0:VICEBERG_SCAN_NODE(71)                                                                                                                                                          
	|      table: taxis                                                                                                                                                                   
	|      predicates: (ts[#5] < '2024-01-02 00:00:00'), (vendor_id[#0] = 2), (ts[#5] >= '2024-01-01 00:00:00')                                                                           
	|      inputSplitNum=1, totalFileSize=3539, scanRanges=1                                                                                                                              
	|      partition=1/0                                                                                                                                                                  
	|      backends:                                                                                                                                                                      
	|        10002                                                                                                                                                                        
	|          s3://warehouse/wh/nyc/taxis/data/vendor_id=2/ts_day=2024-01-01/40e6ca404efa4a44-b888f23546d3a69c_5708e229-2f3d-4b68-a66b-44298a9d9815-0.zstd.parquet start: 0 length: 3539 
	|      cardinality=6, numNodes=1                                                                                                                                                      
	|      pushdown agg=NONE                                                                                                                                                              
	|      icebergPredicatePushdown=                                                                                                                                                      
	|           ref(name="ts") < 1704153600000000                                                                                                                                         
	|           ref(name="vendor_id") == 2                                                                                                                                                
	|           ref(name="ts") >= 1704067200000000                                                                                                                                        
	....
	```

	通过 `EXPLAIN VERBOSE` 语句的结果可知，`vendor_id = 2 and ts >= '2024-01-01' and ts < '2024-01-02'` 谓词条件，最终只命中一个分区（`partition=1/0`）。

	同时也可知，因为在建表时指定了分区 Transform 函数 `DAY(ts)`，原始数据中的的值 `2024-01-01 03:25:15.000000` 会被转换成文件目录中的分区信息 `ts_day=2024-01-01`。

### 06 Time Travel

我们先再次插入几行数据：

```sql
INSERT INTO iceberg.nyc.taxis VALUES (1, 1000375, 8.8, 55.55, 'Y', '2024-01-01 8:10:22'), (3, 1000376, 7.4, 32.35, 'N', '2024-01-02  1:14:45');
Query OK, 2 rows affected (0.17 sec)
{'status':'COMMITTED', 'txnId':'10086'}

mysql> SELECT * FROM iceberg.nyc.taxis;
+-----------+---------+---------------+-------------+--------------------+----------------------------+
| vendor_id | trip_id | trip_distance | fare_amount | store_and_fwd_flag | ts                         |
+-----------+---------+---------------+-------------+--------------------+----------------------------+
|         3 | 1000376 |           7.4 |       32.35 | N                  | 2024-01-02 01:14:45.000000 |
|         2 | 1000372 |           2.5 |       22.15 | N                  | 2024-01-02 12:10:11.000000 |
|         1 | 1000374 |           8.4 |       42.13 | Y                  | 2024-01-03 07:12:33.000000 |
|         1 | 1000371 |           1.8 |       15.32 | N                  | 2024-01-01 09:15:23.000000 |
|         1 | 1000375 |           8.8 |       55.55 | Y                  | 2024-01-01 08:10:22.000000 |
|         2 | 1000373 |           0.9 |        9.01 | N                  | 2024-01-01 03:25:15.000000 |
+-----------+---------+---------------+-------------+--------------------+----------------------------+
6 rows in set (0.11 sec)
```

使用 `iceberg_meta` 表函数查询表的快照信息：

```sql
mysql> select * from iceberg_meta("table" = "iceberg.nyc.taxis", "query_type" = "snapshots");
+---------------------+---------------------+---------------------+-----------+-----------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| committed_at        | snapshot_id         | parent_id           | operation | manifest_list                                                                                             | summary                                                                                                                                                                                                                                                        |
+---------------------+---------------------+---------------------+-----------+-----------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 2024-07-29 03:38:22 | 8483933166442433486 |                  -1 | append    | s3://warehouse/wh/nyc/taxis/metadata/snap-8483933166442433486-1-5f7b7736-8022-4ba1-9db2-51ae7553be4d.avro | {"added-data-files":"4","added-records":"4","added-files-size":"14156","changed-partition-count":"4","total-records":"4","total-files-size":"14156","total-data-files":"4","total-delete-files":"0","total-position-deletes":"0","total-equality-deletes":"0"} |
| 2024-07-29 03:40:23 | 4726331391239920914 | 8483933166442433486 | append    | s3://warehouse/wh/nyc/taxis/metadata/snap-4726331391239920914-1-6aa3d142-6c9c-4553-9c04-08ad4d49a4ea.avro | {"added-data-files":"2","added-records":"2","added-files-size":"7078","changed-partition-count":"2","total-records":"6","total-files-size":"21234","total-data-files":"6","total-delete-files":"0","total-position-deletes":"0","total-equality-deletes":"0"}  |
+---------------------+---------------------+---------------------+-----------+-----------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
2 rows in set (0.07 sec)
```

使用 `FOR VERSION AS OF` 语句查询指定快照：

```sql
mysql> SELECT * FROM iceberg.nyc.taxis FOR VERSION AS OF 8483933166442433486;
+-----------+---------+---------------+-------------+--------------------+----------------------------+
| vendor_id | trip_id | trip_distance | fare_amount | store_and_fwd_flag | ts                         |
+-----------+---------+---------------+-------------+--------------------+----------------------------+
|         1 | 1000371 |           1.8 |       15.32 | N                  | 2024-01-01 09:15:23.000000 |
|         1 | 1000374 |           8.4 |       42.13 | Y                  | 2024-01-03 07:12:33.000000 |
|         2 | 1000372 |           2.5 |       22.15 | N                  | 2024-01-02 12:10:11.000000 |
|         2 | 1000373 |           0.9 |        9.01 | N                  | 2024-01-01 03:25:15.000000 |
+-----------+---------+---------------+-------------+--------------------+----------------------------+
4 rows in set (0.05 sec)

mysql> SELECT * FROM iceberg.nyc.taxis FOR VERSION AS OF 4726331391239920914;
+-----------+---------+---------------+-------------+--------------------+----------------------------+
| vendor_id | trip_id | trip_distance | fare_amount | store_and_fwd_flag | ts                         |
+-----------+---------+---------------+-------------+--------------------+----------------------------+
|         1 | 1000374 |           8.4 |       42.13 | Y                  | 2024-01-03 07:12:33.000000 |
|         1 | 1000375 |           8.8 |       55.55 | Y                  | 2024-01-01 08:10:22.000000 |
|         3 | 1000376 |           7.4 |       32.35 | N                  | 2024-01-02 01:14:45.000000 |
|         2 | 1000372 |           2.5 |       22.15 | N                  | 2024-01-02 12:10:11.000000 |
|         2 | 1000373 |           0.9 |        9.01 | N                  | 2024-01-01 03:25:15.000000 |
|         1 | 1000371 |           1.8 |       15.32 | N                  | 2024-01-01 09:15:23.000000 |
+-----------+---------+---------------+-------------+--------------------+----------------------------+
6 rows in set (0.04 sec)
```

使用 `FOR TIME AS OF` 语句查询指定快照：

```sql
mysql> SELECT * FROM iceberg.nyc.taxis FOR TIME AS OF "2024-07-29 03:38:23";
+-----------+---------+---------------+-------------+--------------------+----------------------------+
| vendor_id | trip_id | trip_distance | fare_amount | store_and_fwd_flag | ts                         |
+-----------+---------+---------------+-------------+--------------------+----------------------------+
|         1 | 1000374 |           8.4 |       42.13 | Y                  | 2024-01-03 07:12:33.000000 |
|         1 | 1000371 |           1.8 |       15.32 | N                  | 2024-01-01 09:15:23.000000 |
|         2 | 1000372 |           2.5 |       22.15 | N                  | 2024-01-02 12:10:11.000000 |
|         2 | 1000373 |           0.9 |        9.01 | N                  | 2024-01-01 03:25:15.000000 |
+-----------+---------+---------------+-------------+--------------------+----------------------------+
4 rows in set (0.04 sec)

mysql> SELECT * FROM iceberg.nyc.taxis FOR TIME AS OF "2024-07-29 03:40:22";
+-----------+---------+---------------+-------------+--------------------+----------------------------+
| vendor_id | trip_id | trip_distance | fare_amount | store_and_fwd_flag | ts                         |
+-----------+---------+---------------+-------------+--------------------+----------------------------+
|         2 | 1000373 |           0.9 |        9.01 | N                  | 2024-01-01 03:25:15.000000 |
|         1 | 1000374 |           8.4 |       42.13 | Y                  | 2024-01-03 07:12:33.000000 |
|         2 | 1000372 |           2.5 |       22.15 | N                  | 2024-01-02 12:10:11.000000 |
|         1 | 1000371 |           1.8 |       15.32 | N                  | 2024-01-01 09:15:23.000000 |
+-----------+---------+---------------+-------------+--------------------+----------------------------+
4 rows in set (0.05 sec)
```

### 07 与 PyIceberg 交互

> 请使用 Doris 2.1.8/3.0.4 以上版本。

加载 Iceberg 表：

```python
from pyiceberg.catalog import load_catalog

catalog = load_catalog(
    "iceberg",
    **{
        "warehouse" = "warehouse",
        "uri" = "http://rest:8181",
        "s3.access-key-id" = "admin",
        "s3.secret-access-key" = "password",
        "s3.endpoint" = "http://minio:9000"
    },
)
table = catalog.load_table("nyc.taxis")
```

读取为 Arrow Table：

```python
print(table.scan().to_arrow())

pyarrow.Table
vendor_id: int64
trip_id: int64
trip_distance: float
fare_amount: double
store_and_fwd_flag: large_string
ts: timestamp[us]
----
vendor_id: [[1],[1],[2],[2]]
trip_id: [[1000371],[1000374],[1000373],[1000372]]
trip_distance: [[1.8],[8.4],[0.9],[2.5]]
fare_amount: [[15.32],[42.13],[9.01],[22.15]]
store_and_fwd_flag: [["N"],["Y"],["N"],["N"]]
ts: [[2024-01-01 09:15:23.000000],[2024-01-03 07:12:33.000000],[2024-01-01 03:25:15.000000],[2024-01-02 12:10:11.000000]]
```

读取为 Pandas DataFrame：

```python
print(table.scan().to_pandas())

vendor_id  trip_id  trip_distance  fare_amount store_and_fwd_flag                    ts
0          1  1000371            1.8        15.32                  N   2024-01-01 09:15:23
1          1  1000374            8.4        42.13                  Y   2024-01-03 07:12:33
2          2  1000373            0.9         9.01                  N   2024-01-01 03:25:15
3          2  1000372            2.5        22.15                  N   2024-01-02 12:10:11
```

读取为 Polars DataFrame：

```python
import polars as pl

print(pl.scan_iceberg(table).collect())

shape: (4, 6)
┌───────────┬─────────┬───────────────┬─────────────┬────────────────────┬─────────────────────┐
│ vendor_id ┆ trip_id ┆ trip_distance ┆ fare_amount ┆ store_and_fwd_flag ┆ ts                  │
│ ---       ┆ ---     ┆ ---           ┆ ---         ┆ ---                ┆ ---                 │
│ i64       ┆ i64     ┆ f32           ┆ f64         ┆ str                ┆ datetime[μs]        │
╞═══════════╪═════════╪═══════════════╪═════════════╪════════════════════╪═════════════════════╡
│ 1         ┆ 1000371 ┆ 1.8           ┆ 15.32       ┆ N                  ┆ 2024-01-01 09:15:23 │
│ 1         ┆ 1000374 ┆ 8.4           ┆ 42.13       ┆ Y                  ┆ 2024-01-03 07:12:33 │
│ 2         ┆ 1000373 ┆ 0.9           ┆ 9.01        ┆ N                  ┆ 2024-01-01 03:25:15 │
│ 2         ┆ 1000372 ┆ 2.5           ┆ 22.15       ┆ N                  ┆ 2024-01-02 12:10:11 │
└───────────┴─────────┴───────────────┴─────────────┴────────────────────┴─────────────────────┘
```

> 通过 pyiceberg 写入 iceberg 数据，请参阅[步骤](#通过-pyiceberg-写入数据)

### 08 附录

#### 通过 PyIceberg 写入数据

加载 Iceberg 表：

```python
from pyiceberg.catalog import load_catalog

catalog = load_catalog(
    "iceberg",
    **{
        "warehouse" = "warehouse",
        "uri" = "http://rest:8181",
        "s3.access-key-id" = "admin",
        "s3.secret-access-key" = "password",
        "s3.endpoint" = "http://minio:9000"
    },
)
table = catalog.load_table("nyc.taxis")
```

Arrow Table 写入 Iceberg：

```python
import pyarrow as pa

df = pa.Table.from_pydict(
    {
        "vendor_id": pa.array([1, 2, 2, 1], pa.int64()),
        "trip_id": pa.array([1000371, 1000372, 1000373, 1000374], pa.int64()),
        "trip_distance": pa.array([1.8, 2.5, 0.9, 8.4], pa.float32()),
        "fare_amount": pa.array([15.32, 22.15, 9.01, 42.13], pa.float64()),
        "store_and_fwd_flag": pa.array(["N", "N", "N", "Y"], pa.string()),
        "ts": pa.compute.strptime(
            ["2024-01-01 9:15:23", "2024-01-02 12:10:11", "2024-01-01 3:25:15", "2024-01-03 7:12:33"],
            "%Y-%m-%d %H:%M:%S",
            "us",
        ),
    }
)
table.append(df)
```

Pandas DataFrame 写入 Iceberg：

```python
import pyarrow as pa
import pandas as pd

df = pd.DataFrame(
    {
        "vendor_id": pd.Series([1, 2, 2, 1]).astype("int64[pyarrow]"),
        "trip_id": pd.Series([1000371, 1000372, 1000373, 1000374]).astype("int64[pyarrow]"),
        "trip_distance": pd.Series([1.8, 2.5, 0.9, 8.4]).astype("float32[pyarrow]"),
        "fare_amount": pd.Series([15.32, 22.15, 9.01, 42.13]).astype("float64[pyarrow]"),
        "store_and_fwd_flag": pd.Series(["N", "N", "N", "Y"]).astype("string[pyarrow]"),
        "ts": pd.Series(["2024-01-01 9:15:23", "2024-01-02 12:10:11", "2024-01-01 3:25:15", "2024-01-03 7:12:33"]).astype("timestamp[us][pyarrow]"),
    }
)
table.append(pa.Table.from_pandas(df))
```

Polars DataFrame 写入 Iceberg：

```python
import polars as pl

df = pl.DataFrame(
    {
        "vendor_id": [1, 2, 2, 1],
        "trip_id": [1000371, 1000372, 1000373, 1000374],
        "trip_distance": [1.8, 2.5, 0.9, 8.4],
        "fare_amount": [15.32, 22.15, 9.01, 42.13],
        "store_and_fwd_flag": ["N", "N", "N", "Y"],
        "ts": ["2024-01-01 9:15:23", "2024-01-02 12:10:11", "2024-01-01 3:25:15", "2024-01-03 7:12:33"],
    },
    {
        "vendor_id": pl.Int64,
        "trip_id": pl.Int64,
        "trip_distance": pl.Float32,
        "fare_amount": pl.Float64,
        "store_and_fwd_flag": pl.String,
        "ts": pl.String,
    },
).with_columns(pl.col("ts").str.strptime(pl.Datetime, "%Y-%m-%d %H:%M:%S"))
table.append(df.to_arrow())
```

