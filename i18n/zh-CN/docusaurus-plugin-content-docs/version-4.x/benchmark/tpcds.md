---
{
    "title": "TPC-DS Benchmark",
    "language": "zh-CN",
    "description": "TPC-DS（Transaction Processing Performance Council Decision Support Benchmark）是一个以决策支持为重点的基准测试，旨在评估数据仓库和分析系统的性能。"
}
---

# TPC-DS Benchmark

TPC-DS（Transaction Processing Performance Council Decision Support Benchmark）是一个以决策支持为重点的基准测试，旨在评估数据仓库和分析系统的性能。它是由 TPC（Transaction Processing Performance Council）组织开发的，用于比较不同系统在处理复杂查询和大规模数据分析方面的能力。

TPC-DS 的设计目标是模拟现实世界中的复杂决策支持工作负载。它通过一系列复杂的查询和数据操作来测试系统的性能，包括联接、聚合、排序、过滤、子查询等。这些查询模式涵盖了从简单到复杂的各种场景，如报表生成、数据挖掘、OLAP（联机分析处理）等。

本文档主要介绍 Doris 在 TPC-DS 1000G 测试集上的性能表现。

在 TPC-DS 标准测试数据集上的 99 个查询上，我们基于 Apache Doris 2.1.7-rc03 和 Apache Doris 2.0.15.1 版本进行了对比测试。

![TPCDS_1000G](/images/tpcds_2.1.png)

## 1. 硬件环境

| 硬件   | 配置说明                                     |
|------|------------------------------------------|
| 机器数量 | 4 台阿里云主机（1 个 FE，3 个 BE）                  |
| CPU  | Intel Xeon (Ice Lake) Platinum 8369B 32 核 |
| 内存   | 128G                                     |
| 磁盘   | 阿里云 ESSD (PL0)                           |

## 2. 软件环境

- Doris 部署 3BE 1FE
- 内核版本：Linux version 5.15.0-101-generic 
- 操作系统版本：Ubuntu 20.04 LTS (Focal Fossa)
- Doris 软件版本：Apache Doris 2.1.7-rc03、Apache Doris 2.0.15.1
- JDK：openjdk version "1.8.0_352-352"

## 3. 测试数据量

整个测试模拟生成 TPC-DS 1000G 的数据分别导入到 Apache Doris 2.1.7-rc03 和 Apache Doris 2.0.15.1 版本进行测试，下面是表的相关说明及数据量。

| TPC-DS 表名              | 行数            |
|------------------------|---------------|
| customer_demographics  | 1,920,800     |
| reason                 | 65            |
| warehouse              | 20            |
| date_dim               | 73,049        |
| catalog_sales          | 1,439,980,416 |
| call_center            | 42            |
| inventory              | 783,000,000   |
| catalog_returns        | 143,996,756   |
| household_demographics | 7,200         |
| customer_address       | 6,000,000     |
| income_band            | 20            |
| catalog_page           | 30,000        |
| item                   | 300,000       |
| web_returns            | 71,997,522    |
| web_site               | 54            |
| promotion              | 1,500         |
| web_sales              | 720,000,376   |
| store                  | 1,002         |
| web_page               | 3,000         |
| time_dim               | 86,400        |
| store_returns          | 287,999,764   |
| store_sales            | 2,879,987,999 |
| ship_mode              | 20            |
| customer               | 12,000,000    |

## 4. 测试 SQL

TPC-DS 99 个测试查询语句： [TPC-DS-Query-SQL](https://github.com/apache/doris/tree/master/tools/tpcds-tools/queries/sf1000)


## 5. 测试结果

这里我们使用 Apache Doris 2.1.7-rc03 和 Apache Doris 2.0.15.1 版本进行对比测试，测试结果如下：(由于缺少最新的内存优化，Apache Doris 2.0.15.1 q78 q79 无法执行，在计算总和时被删除)

| Query     | Apache Doris 2.1.7-rc03  (ms) | Apache Doris 2.0.15.1-rc01  (ms) |
|-----------|-------------------------------|----------------------------------|
| query01   | 630                           | 890                              |
| query02   | 4930                          | 6930                             |
| query03   | 360                           | 460                              |
| query04   | 11070                         | 42320                            |
| query05   | 620                           | 15360                            |
| query06   | 220                           | 1020                             |
| query07   | 550                           | 750                              |
| query08   | 330                           | 670                              |
| query09   | 6830                          | 7550                             |
| query10   | 370                           | 2900                             |
| query11   | 6960                          | 27380                            |
| query12   | 100                           | 80                               |
| query13   | 790                           | 2860                             |
| query14   | 13470                         | 42340                            |
| query15   | 510                           | 940                              |
| query16   | 520                           | 550                              |
| query17   | 1310                          | 2650                             |
| query18   | 560                           | 820                              |
| query19   | 200                           | 400                              |
| query20   | 100                           | 190                              |
| query21   | 80                            | 80                               |
| query22   | 2300                          | 3070                             |
| query23   | 38240                         | 75260                            |
| query24   | 8340                          | 26580                            |
| query25   | 780                           | 1190                             |
| query26   | 200                           | 220                              |
| query27   | 530                           | 750                              |
| query28   | 5940                          | 7400                             |
| query29   | 940                           | 1250                             |
| query30   | 270                           | 490                              |
| query31   | 1890                          | 2530                             |
| query32   | 60                            | 70                               |
| query33   | 350                           | 450                              |
| query34   | 750                           | 1380                             |
| query35   | 1370                          | 8970                             |
| query36   | 530                           | 570                              |
| query37   | 60                            | 60                               |
| query38   | 7520                          | 8710                             |
| query39   | 560                           | 1010                             |
| query40   | 150                           | 180                              |
| query41   | 50                            | 40                               |
| query42   | 100                           | 140                              |
| query43   | 1150                          | 1960                             |
| query44   | 2020                          | 3220                             |
| query45   | 430                           | 960                              |
| query46   | 1250                          | 2760                             |
| query47   | 2660                          | 5790                             |
| query48   | 630                           | 2570                             |
| query49   | 730                           | 800                              |
| query50   | 1640                          | 2200                             |
| query51   | 6430                          | 6270                             |
| query52   | 110                           | 160                              |
| query53   | 250                           | 490                              |
| query54   | 1280                          | 7790                             |
| query55   | 110                           | 160                              |
| query56   | 290                           | 410                              |
| query57   | 1480                          | 3510                             |
| query58   | 240                           | 550                              |
| query59   | 7760                          | 11870                            |
| query60   | 380                           | 490                              |
| query61   | 540                           | 670                              |
| query62   | 740                           | 1560                             |
| query63   | 210                           | 460                              |
| query64   | 5790                          | 6840                             |
| query65   | 4900                          | 7960                             |
| query66   | 480                           | 810                              |
| query67   | 27320                         | 46110                            |
| query68   | 1600                          | 2380                             |
| query69   | 380                           | 800                              |
| query70   | 3480                          | 5330                             |
| query71   | 460                           | 790                              |
| query72   | 3160                          | 5390                             |
| query73   | 660                           | 1250                             |
| query74   | 5990                          | 16450                            |
| query75   | 4610                          | 8410                             |
| query76   | 1590                          | 2950                             |
| query77   | 300                           | 480                              |
| query78   | 17970                         | x                                |
| query79   | 3040                          | x                                |
| query80   | 570                           | 910                              |
| query81   | 460                           | 760                              |
| query82   | 270                           | 330                              |
| query83   | 220                           | 290                              |
| query84   | 130                           | 110                              |
| query85   | 520                           | 470                              |
| query86   | 760                           | 1220                             |
| query87   | 800                           | 8760                             |
| query88   | 5560                          | 9690                             |
| query89   | 430                           | 750                              |
| query90   | 150                           | 400                              |
| query91   | 150                           | 120                              |
| query92   | 40                            | 40                               |
| query93   | 2440                          | 2670                             |
| query94   | 340                           | 310                              |
| query95   | 350                           | 1810                             |
| query96   | 660                           | 1680                             |
| query97   | 5020                          | 14990                            |
| query98   | 190                           | 330                              |
| query99   | 1560                          | 3230                             |
| **Total** | **261320**                    | **507380**                       |

## 6. 环境准备

请先参照 [官方文档](../install/deploy-manually/integrated-storage-compute-deploy-manually) 进行 Doris 的安装部署，以获得一个正常运行中的 Doris 集群（至少包含 1 FE 1 BE，推荐 1 FE 3 BE）。

## 7. 数据准备

### 7.1 下载安装 TPC-DS 数据生成工具

执行以下脚本下载并编译  [tpcds-tools](https://github.com/apache/doris/tree/master/tools/tpcds-tools)  工具。

```shell
sh bin/build-tpcds-tools.sh
```

### 7.2 生成 TPC-DS 测试集

执行以下脚本生成 TPC-DS 数据集：

```shell
sh bin/gen-tpcds-data.sh -s 1000
```

> 注 1：通过 `sh gen-tpcds-data.sh -h` 查看脚本帮助。
>
> 注 2：数据会以 `.dat` 为后缀生成在  `tpcds-data/` 目录下。文件总大小约 1000GB。生成时间可能在数分钟到 1 小时不等。
>
> 注 3：默认生成 100G 的标准测试数据集

### 7.3 建表

#### 7.3.1 准备 `doris-cluster.conf` 文件

在调用导入脚本前，需要将 FE 的 ip 端口等信息写在 `doris-cluster.conf` 文件中。

文件位置在 `${DORIS_HOME}/tools/tpcds-tools/conf/` 目录下。

文件内容包括 FE 的 ip，HTTP 端口，用户名，密码以及待导入数据的 DB 名称：

```shell
# Any of FE host
export FE_HOST='127.0.0.1'
# http_port in fe.conf
export FE_HTTP_PORT=8030
# query_port in fe.conf
export FE_QUERY_PORT=9030
# Doris username
export USER='root'
# Doris password
export PASSWORD=''
# The database where TPC-DS tables located
export DB='tpcds'
```

#### 7.3.2 执行以下脚本生成创建 TPC-DS 表

```shell
sh bin/create-tpcds-tables.sh -s 1000
```
或者复制 [create-tpcds-tables.sql](https://github.com/apache/doris/blob/master/tools/tpcds-tools/ddl/create-tpcds-tables-sf1000.sql) 中的建表语句，在 Doris 中执行。


### 7.4 导入数据

通过下面的命令执行数据导入：

```shell
sh bin/load-tpcds-data.sh
```


### 7.5 查询测试

### 7.5.1 执行查询脚本

单个 SQL 执行 或者 执行下面的命令

```shell
sh bin/run-tpcds-queries.sh -s 1000
```

### 7.5.2 单个 SQL 执行

你也可以从代码库里获取最新的 SQL。最新测试查询语句地址：[TPC-DS 测试查询语句](https://github.com/apache/doris/tree/master/tools/tpcds-tools/queries/sf1000)

