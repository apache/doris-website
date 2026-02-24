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

在 TPC-DS 标准测试数据集上的 99 个查询上，我们基于 Apache Doris 3.0.3-rc03 (存算分离模式) 和 Apache Doris 2.1.7-rc03 版本进行了对比测试。3.x 版本存算一体模式的性能参照 2.1.x 版本。

![TPCDS_1000G](/images/tpcds_3.0.png)

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
- Doris 软件版本：Apache Doris 3.0.3-rc03 (存算分离模式), Apache Doris 2.1.7-rc03
- JDK：openjdk version "17.0.2"

## 3. 测试数据量

整个测试模拟生成 TPC-DS 1000G 的数据分别导入到 Apache Doris 3.0.3-rc03 (存算分离模式) 和 Apache Doris 2.1.7-rc03 版本进行测试，下面是表的相关说明及数据量。

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

这里我们使用 Apache Doris 3.0.3-rc03 (存算分离模式) 和 Apache Doris 2.1.7-rc03 版本进行对比测试，测试结果如下：

| Query     | Apache Doris 3.0.3-rc03 Compute-Storage Decoupled Mode (ms) | Apache Doris 2.1.7-rc03 (ms) |
|-----------|-----------------------------------------------------------|------------------------------|
| query01   | 580                                                       | 630                          |
| query02   | 5540                                                      | 4930                         |
| query03   | 350                                                       | 360                          |
| query04   | 10790                                                     | 11070                        |
| query05   | 710                                                       | 620                          |
| query06   | 230                                                       | 220                          |
| query07   | 590                                                       | 550                          |
| query08   | 350                                                       | 330                          |
| query09   | 7520                                                      | 6830                         |
| query10   | 390                                                       | 370                          |
| query11   | 6560                                                      | 6960                         |
| query12   | 120                                                       | 100                          |
| query13   | 780                                                       | 790                          |
| query14   | 13200                                                     | 13470                        |
| query15   | 400                                                       | 510                          |
| query16   | 410                                                       | 520                          |
| query17   | 1300                                                      | 1310                         |
| query18   | 650                                                       | 560                          |
| query19   | 250                                                       | 200                          |
| query20   | 110                                                       | 100                          |
| query21   | 110                                                       | 80                           |
| query22   | 1570                                                      | 2300                         |
| query23   | 37180                                                     | 38240                        |
| query24   | 7470                                                      | 8340                         |
| query25   | 920                                                       | 780                          |
| query26   | 200                                                       | 200                          |
| query27   | 550                                                       | 530                          |
| query28   | 7300                                                      | 5940                         |
| query29   | 920                                                       | 940                          |
| query30   | 300                                                       | 270                          |
| query31   | 2000                                                      | 1890                         |
| query32   | 70                                                        | 60                           |
| query33   | 400                                                       | 350                          |
| query34   | 760                                                       | 750                          |
| query35   | 1290                                                      | 1370                         |
| query36   | 460                                                       | 530                          |
| query37   | 80                                                        | 60                           |
| query38   | 5450                                                      | 7520                         |
| query39   | 760                                                       | 560                          |
| query40   | 140                                                       | 150                          |
| query41   | 50                                                        | 50                           |
| query42   | 110                                                       | 100                          |
| query43   | 1170                                                      | 1150                         |
| query44   | 2120                                                      | 2020                         |
| query45   | 280                                                       | 430                          |
| query46   | 1390                                                      | 1250                         |
| query47   | 2160                                                      | 2660                         |
| query48   | 660                                                       | 630                          |
| query49   | 810                                                       | 730                          |
| query50   | 1570                                                      | 1640                         |
| query51   | 6030                                                      | 6430                         |
| query52   | 120                                                       | 110                          |
| query53   | 280                                                       | 250                          |
| query54   | 1540                                                      | 1280                         |
| query55   | 130                                                       | 110                          |
| query56   | 300                                                       | 290                          |
| query57   | 1240                                                      | 1480                         |
| query58   | 260                                                       | 240                          |
| query59   | 10120                                                     | 7760                         |
| query60   | 370                                                       | 380                          |
| query61   | 560                                                       | 540                          |
| query62   | 920                                                       | 740                          |
| query63   | 230                                                       | 210                          |
| query64   | 1660                                                      | 5790                         |
| query65   | 4800                                                      | 4900                         |
| query66   | 400                                                       | 480                          |
| query67   | 24190                                                     | 27320                        |
| query68   | 1400                                                      | 1600                         |
| query69   | 1170                                                      | 380                          |
| query70   | 3160                                                      | 3480                         |
| query71   | 440                                                       | 460                          |
| query72   | 4090                                                      | 3160                         |
| query73   | 660                                                       | 660                          |
| query74   | 5720                                                      | 5990                         |
| query75   | 4560                                                      | 4610                         |
| query76   | 1800                                                      | 1590                         |
| query77   | 330                                                       | 300                          |
| query78   | 16300                                                     | 17970                        |
| query79   | 3160                                                      | 3040                         |
| query80   | 590                                                       | 570                          |
| query81   | 540                                                       | 460                          |
| query82   | 320                                                       | 270                          |
| query83   | 230                                                       | 220                          |
| query84   | 130                                                       | 130                          |
| query85   | 780                                                       | 520                          |
| query86   | 660                                                       | 760                          |
| query87   | 6200                                                      | 8000                         |
| query88   | 5620                                                      | 5560                         |
| query89   | 400                                                       | 430                          |
| query90   | 150                                                       | 150                          |
| query91   | 160                                                       | 150                          |
| query92   | 50                                                        | 40                           |
| query93   | 2380                                                      | 2440                         |
| query94   | 290                                                       | 340                          |
| query95   | 410                                                       | 350                          |
| query96   | 680                                                       | 660                          |
| query97   | 4870                                                      | 5020                         |
| query98   | 200                                                       | 190                          |
| query99   | 1940                                                      | 1560                         |
| **Total** | **251620**                                                | **261320**                   |

## 6. 环境准备

请先参照 [官方文档](../../current/install/deploy-manually/integrated-storage-compute-deploy-manually) 进行 Doris 的安装部署，以获得一个正常运行中的 Doris 集群（至少包含 1 FE 1 BE，推荐 1 FE 3 BE）。

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
