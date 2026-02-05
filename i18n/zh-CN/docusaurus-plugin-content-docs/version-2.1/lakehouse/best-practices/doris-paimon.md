---
{
    "title": "使用 Doris 和 Paimon",
    "language": "zh-CN",
    "description": "作为一种全新的开放式的数据管理架构，湖仓一体（Data Lakehouse）融合了数据仓库的高性能、实时性以及数据湖的低成本、灵活性等优势，帮助用户更加便捷地满足各种数据处理分析的需求，在企业的大数据体系中已经得到越来越多的应用。"
}
---

作为一种全新的开放式的数据管理架构，湖仓一体（Data Lakehouse）融合了数据仓库的高性能、实时性以及数据湖的低成本、灵活性等优势，帮助用户更加便捷地满足各种数据处理分析的需求，在企业的大数据体系中已经得到越来越多的应用。

在过去多个版本中，Apache Doris 持续加深与数据湖的融合，当前已演进出一套成熟的湖仓一体解决方案。

- 自 0.15 版本起，Apache Doris 引入 Hive 和 Iceberg 外部表，尝试在 Apache Iceberg 之上探索与数据湖的能力结合。
- 自 1.2 版本起，Apache Doris 正式引入 Multi-Catalog 功能，实现了多种数据源的自动元数据映射和数据访问、并对外部数据读取和查询执行等方面做了诸多性能优化，完全具备了构建极速易用 Lakehouse 架构的能力。
- 在 2.1 版本中，Apache Doris 湖仓一体架构得到全面加强，不仅增强了主流数据湖格式（Hudi、Iceberg、Paimon 等）的读取和写入能力，还引入了多 SQL 方言兼容、可从原有系统无缝切换至 Apache Doris。在数据科学及大规模数据读取场景上，Doris 集成了 Arrow Flight 高速读取接口，使得数据传输效率实现 100 倍的提升。

![使用 Doris 和 Paimon 构建 Lakehouse](/images/lakehouse-architecture-for-doris-and-paimon.png)

## Apache Doris & Paimon

Apache Paimon 是一种数据湖格式，并创新性地将数据湖格式和 LSM 结构的优势相结合，成功将高效的实时流更新能力引入数据湖架构中，这使得 Paimon 能够实现数据的高效管理和实时分析，为构建实时湖仓架构提供了强大的支撑。

为了充分发挥 Paimon 的能力，提高对 Paimon 数据的查询效率，Apache Doris 对 Paimon 的多项最新特性提供了原生支持：

- 支持 Hive Metastore、FileSystem 等多种类型的 Paimon Catalog。
- 原生支持 Paimon 0.6 版本发布的 Primary Key Table Read Optimized 功能。
- 原生支持 Paimon 0.8 版本发布的 Primary Key Table Deletion Vector 功能。

基于 Apache Doris 的高性能查询引擎和 Apache Paimon 高效的实时流更新能力，用户可以实现：

- 数据实时入湖：借助 Paimon 的 LSM-Tree 模型，数据入湖的时效性可以降低到分钟级；同时，Paimon 支持包括聚合、去重、部分列更新在内的多种数据更新能力，使得数据流动更加灵活高效。
- 高性能数据处理分析：Paimon 所提供的 Append Only Table、Read Optimized、Deletion Vector 等技术，可与 Doris 强大的查询引擎对接，实现湖上数据的快速查询及分析响应。

未来 Apache Doris 将会逐步支持包括 Time Travel、增量数据读取在内的 Apache Paimon 更多高级特性，共同构建统一、高性能、实时的湖仓平台。

本文将会再 Docker 环境中，为读者讲解如何快速搭建 Apache Doris + Apache Paimon 测试 & 演示环境，并展示各功能的使用操作。

关于更多说明，请参阅 [Paimon Catalog](../catalogs/paimon-catalog)

## 使用指南

本文涉及所有脚本和代码可以从该地址获取：[https://github.com/apache/doris/tree/master/samples/datalake/iceberg_and_paimon](https://github.com/apache/doris/tree/master/samples/datalake/iceberg_and_paimon)

### 01 环境准备

本文示例采用 Docker Compose 部署，组件及版本号如下：

| 组件名称 | 版本 |
| --- | --- |
| Apache Doris | 默认 2.1.5，可修改 |
| Apache Paimon | 0.8|
| Apache Flink | 1.18|
| MinIO | RELEASE.2024-04-29T09-56-05Z|

### 02 环境部署

1. 启动所有组件

	`bash ./start_all.sh`

2. 启动后，可以使用如下脚本，登陆 Flink 命令行或 Doris 命令行：

	```sql
	-- login flink
	bash ./start_flink_client.sh
	
	-- login doris
	bash ./start_doris_client.sh
	```

### 03 数据准备

首先登陆 Flink 命令行后，可以看到一张预构建的表。表中已经包含一些数据，我们可以通过 Flink SQL 进行查看。

```sql
Flink SQL> use paimon.db_paimon;
[INFO] Execute statement succeed.

Flink SQL> show tables;
+------------+
| table name |
+------------+
|   customer |
+------------+
1 row in set

Flink SQL> show create table customer;
+------------------------------------------------------------------------+
|                                                                 result |
+------------------------------------------------------------------------+
| CREATE TABLE `paimon`.`db_paimon`.`customer` (
  `c_custkey` INT NOT NULL,
  `c_name` VARCHAR(25),
  `c_address` VARCHAR(40),
  `c_nationkey` INT NOT NULL,
  `c_phone` CHAR(15),
  `c_acctbal` DECIMAL(12, 2),
  `c_mktsegment` CHAR(10),
  `c_comment` VARCHAR(117),
  CONSTRAINT `PK_c_custkey_c_nationkey` PRIMARY KEY (`c_custkey`, `c_nationkey`) NOT ENFORCED
) PARTITIONED BY (`c_nationkey`)
WITH (
  'bucket' = '1',
  'path' = 's3://warehouse/wh/db_paimon.db/customer',
  'deletion-vectors.enabled' = 'true'
)
 |
+-------------------------------------------------------------------------+
1 row in set

Flink SQL> desc customer;
+--------------+----------------+-------+-----------------------------+--------+-----------+
|         name |           type |  null |                         key | extras | watermark |
+--------------+----------------+-------+-----------------------------+--------+-----------+
|    c_custkey |            INT | FALSE | PRI(c_custkey, c_nationkey) |        |           |
|       c_name |    VARCHAR(25) |  TRUE |                             |        |           |
|    c_address |    VARCHAR(40) |  TRUE |                             |        |           |
|  c_nationkey |            INT | FALSE | PRI(c_custkey, c_nationkey) |        |           |
|      c_phone |       CHAR(15) |  TRUE |                             |        |           |
|    c_acctbal | DECIMAL(12, 2) |  TRUE |                             |        |           |
| c_mktsegment |       CHAR(10) |  TRUE |                             |        |           |
|    c_comment |   VARCHAR(117) |  TRUE |                             |        |           |
+--------------+----------------+-------+-----------------------------+--------+-----------+
8 rows in set

Flink SQL> select * from customer order by c_custkey limit 4;
+-----------+--------------------+--------------------------------+-------------+-----------------+-----------+--------------+--------------------------------+
| c_custkey |             c_name |                      c_address | c_nationkey |         c_phone | c_acctbal | c_mktsegment |                      c_comment |
+-----------+--------------------+--------------------------------+-------------+-----------------+-----------+--------------+--------------------------------+
|         1 | Customer#000000001 |              IVhzIApeRb ot,c,E |          15 | 25-989-741-2988 |    711.56 |     BUILDING | to the even, regular platel... |
|         2 | Customer#000000002 | XSTf4,NCwDVaWNe6tEgvwfmRchLXak |          13 | 23-768-687-3665 |    121.65 |   AUTOMOBILE | l accounts. blithely ironic... |
|         3 | Customer#000000003 |                   MG9kdTD2WBHm |           1 | 11-719-748-3364 |   7498.12 |   AUTOMOBILE |  deposits eat slyly ironic,... |
|        32 | Customer#000000032 | jD2xZzi UmId,DCtNBLXKj9q0Tl... |          15 | 25-430-914-2194 |   3471.53 |     BUILDING | cial ideas. final, furious ... |
+-----------+--------------------+--------------------------------+-------------+-----------------+-----------+--------------+--------------------------------+
4 rows in set
```

### 04 数据查询

如下所示，Doris 集群中已经创建了名为 `paimon` 的 Catalog（可通过 SHOW CATALOGS 查看）。以下为该 Catalog 的创建语句：

```sql
-- 已创建，无需执行
CREATE CATALOG `paimon` PROPERTIES (
    "type" = "paimon",
    "warehouse" = "s3://warehouse/wh/",
    "s3.endpoint"="http://minio:9000",
    "s3.access_key"="admin",
    "s3.secret_key"="password",
    "s3.region"="us-east-1"
);
```

你可登录到 Doris 中查询 Paimon 的数据：

```sql
mysql> use paimon.db_paimon;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show tables;
+---------------------+
| Tables_in_db_paimon |
+---------------------+
| customer            |
+---------------------+
1 row in set (0.00 sec)

mysql> select * from customer order by c_custkey limit 4;
+-----------+--------------------+---------------------------------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
| c_custkey | c_name             | c_address                             | c_nationkey | c_phone         | c_acctbal | c_mktsegment | c_comment                                                                                              |
+-----------+--------------------+---------------------------------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
|         1 | Customer#000000001 | IVhzIApeRb ot,c,E                     |          15 | 25-989-741-2988 |    711.56 | BUILDING     | to the even, regular platelets. regular, ironic epitaphs nag e                                         |
|         2 | Customer#000000002 | XSTf4,NCwDVaWNe6tEgvwfmRchLXak        |          13 | 23-768-687-3665 |    121.65 | AUTOMOBILE   | l accounts. blithely ironic theodolites integrate boldly: caref                                        |
|         3 | Customer#000000003 | MG9kdTD2WBHm                          |           1 | 11-719-748-3364 |   7498.12 | AUTOMOBILE   |  deposits eat slyly ironic, even instructions. express foxes detect slyly. blithely even accounts abov |
|        32 | Customer#000000032 | jD2xZzi UmId,DCtNBLXKj9q0Tlp2iQ6ZcO3J |          15 | 25-430-914-2194 |   3471.53 | BUILDING     | cial ideas. final, furious requests across the e                                                       |
+-----------+--------------------+---------------------------------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
4 rows in set (1.89 sec)
```

### 05 读取增量数据

我们可以通过 Flink SQL 更新 Paimon 表中的数据：

```sql
Flink SQL> update customer set c_address='c_address_update' where c_nationkey = 1;
[INFO] Submitting SQL update statement to the cluster...
[INFO] SQL update statement has been successfully submitted to the cluster:
Job ID: ff838b7b778a94396b332b0d93c8f7ac
```

等 Flink SQL 执行完毕后，在 Doris 中可直接查看到最新的数据：

```sql
mysql> select * from customer where c_nationkey=1 limit 2;
+-----------+--------------------+-----------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
| c_custkey | c_name             | c_address       | c_nationkey | c_phone         | c_acctbal | c_mktsegment | c_comment                                                                                              |
+-----------+--------------------+-----------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
|         3 | Customer#000000003 | c_address_update |           1 | 11-719-748-3364 |   7498.12 | AUTOMOBILE   |  deposits eat slyly ironic, even instructions. express foxes detect slyly. blithely even accounts abov |
|       513 | Customer#000000513 | c_address_update |           1 | 11-861-303-6887 |    955.37 | HOUSEHOLD    | press along the quickly regular instructions. regular requests against the carefully ironic s          |
+-----------+--------------------+-----------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
2 rows in set (0.19 sec)
```

### Benchmark

我们在 Paimon（0.8）版本的 TPCDS 1000 数据集上进行了简单的测试，分别使用了 Apache Doris 2.1.5 版本和 Trino 422 版本，均开启 Primary Key Table Read Optimized 功能。

![](/images/quick-start/lakehouse-paimon-benchmark.PNG)

从测试结果可以看到，Doris 在标准静态测试集上的平均查询性能是 Trino 的 3~5 倍。后续我们将针对 Deletion Vector 进行优化，进一步提升真实业务场景下的查询效率。 

## 查询优化

对于基线数据来说，Apache Paimon 在 0.6 版本中引入 Primary Key Table Read Optimized 功能后，使得查询引擎可以直接访问底层的 Parquet/ORC 文件，大幅提升了基线数据的读取效率。对于尚未合并的增量数据（INSERT、UPDATE 或 DELETE 所产生的数据增量）来说，可以通过 Merge-on-Read 的方式进行读取。此外，Paimon 在 0.8 版本中还引入的 Deletion Vector 功能，能够进一步提升查询引擎对增量数据的读取效率。
Apache Doris 支持通过原生的 Reader 读取 Deletion Vector 并进行 Merge on Read，我们通过 Doris 的 EXPLAIN 语句，来演示在一个查询中，基线数据和增量数据的查询方式。

```sql
mysql> explain verbose select * from customer where c_nationkey < 3;
+------------------------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                                |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| ...............                                                                                                                                |
|                                                                                                                                                |
|   0:VPAIMON_SCAN_NODE(68)                                                                                                                      |
|      table: customer                                                                                                                           |
|      predicates: (c_nationkey[#3] < 3)                                                                                                         |
|      inputSplitNum=4, totalFileSize=238324, scanRanges=4                                                                                       |
|      partition=3/0                                                                                                                             |
|      backends:                                                                                                                                 |
|        10002                                                                                                                                   |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=1/bucket-0/data-15cee5b7-1bd7-42ca-9314-56d92c62c03b-0.orc start: 0 length: 66600 |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=1/bucket-0/data-5d50255a-2215-4010-b976-d5dc656f3444-0.orc start: 0 length: 44501 |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=2/bucket-0/data-e98fb7ef-ec2b-4ad5-a496-713cb9481d56-0.orc start: 0 length: 64059 |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=0/bucket-0/data-431be05d-50fa-401f-9680-d646757d0f95-0.orc start: 0 length: 63164 |
|      cardinality=18751, numNodes=1                                                                                                             |
|      pushdown agg=NONE                                                                                                                         |
|      paimonNativeReadSplits=4/4                                                                                                                |
|      PaimonSplitStats:                                                                                                                         |
|        SplitStat [type=NATIVE, rowCount=1542, rawFileConvertable=true, hasDeletionVector=true]                                                 |
|        SplitStat [type=NATIVE, rowCount=750, rawFileConvertable=true, hasDeletionVector=false]                                                 |
|        SplitStat [type=NATIVE, rowCount=750, rawFileConvertable=true, hasDeletionVector=false]                                                 |
|      tuple ids: 0
| ...............                                                                                                           |                                                                                                  |
+------------------------------------------------------------------------------------------------------------------------------------------------+
67 rows in set (0.23 sec)
```

可以看到，对于刚才通过 Flink SQL 更新的表，包含 4 个分片，并且全部分片都可以通过 Native Reader 进行访问（`paimonNativeReadSplits=4/4`）。并且第一个分片的`hasDeletionVector`的属性为`true`，表示该分片有对应的 Deletion Vector，读取时会根据 Deletion Vector 进行数据过滤。
