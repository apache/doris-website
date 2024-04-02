---
{
    "title": "TPC-DS Benchmark",
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

# TPC-DS Benchmark

TPC-DS（Transaction Processing Performance Council Decision Support Benchmark）是一个以决策支持为重点的基准测试，旨在评估数据仓库和分析系统的性能。它是由 TPC（Transaction Processing Performance Council）组织开发的，用于比较不同系统在处理复杂查询和大规模数据分析方面的能力。

TPC-DS 的设计目标是模拟现实世界中的复杂决策支持工作负载。它通过一系列复杂的查询和数据操作来测试系统的性能，包括联接、聚合、排序、过滤、子查询等。这些查询模式涵盖了从简单到复杂的各种场景，如报表生成、数据挖掘、OLAP（联机分析处理）等。

本文档主要介绍 Doris 在 TPC-DS 1000G 测试集上的性能表现。

在 TPC-DS 标准测试数据集上的 99 个查询上，我们基于 Apache Doris 2.1.1-rc03 和 Apache Doris 2.0.6 版本进行了对比测试。

![TPCDS_1000G](/images/tpcds_2.1.png)

## 1. 硬件环境

| 硬件   | 配置说明                                 |
|------|--------------------------------------|
| 机器数量 | 4 台腾讯云主机（1个FE，3个BE）                  |
| CPU  | AMD EPYC™ Milan(2.55GHz/3.5GHz)  48核 |
| 内存   | 192G                                 |
| 网络带宽 | 21Gbps                               |
| 磁盘   | 高性能云硬盘                               |

## 2. 软件环境

- Doris部署 3BE 1FE
- 内核版本：Linux version 5.4.0-96-generic (buildd@lgw01-amd64-051)
- 操作系统版本：Ubuntu 20.04 LTS (Focal Fossa)
- Doris 软件版本： Apache Doris 2.1.1-rc03、 Apache Doris 2.0.6
- JDK：openjdk version "1.8.0_131"

## 3. 测试数据量

整个测试模拟生成 TPC-DS 1000G 的数据分别导入到 Apache Doris 2.1.1-rc03 和 Apache Doris 2.0.6 版本进行测试，下面是表的相关说明及数据量。

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

## 4. 测试SQL

TPC-DS 99 个测试查询语句 ： [TPC-DS-Query-SQL](https://github.com/apache/doris/tree/master/tools/tpcds-tools/queries/sf1000)


## 5. 测试结果

这里我们使用 Apache Doris 2.1.1-rc03 和 Apache Doris 2.0.6 版本进行对比测试，测试结果如下：

| Query     | Apache Doris 2.1.1-rc03  (ms) | Apache Doris 2.0.6  (ms) |
|-----------|-------------------------------|--------------------------|
| query1    | 729                           | 914                      |
| query2    | 5120                          | 4669                     |
| query3    | 286                           | 285                      |
| query4    | 11633                         | 35148                    |
| query5    | 641                           | 22979                    |
| query6    | 267                           | 1351                     |
| query7    | 468                           | 517                      |
| query8    | 263                           | 591                      |
| query9    | 4444                          | 5430                     |
| query10   | 418                           | 3341                     |
| query11   | 7246                          | 23300                    |
| query12   | 115                           | 105                      |
| query13   | 661                           | 1719                     |
| query14   | 13955                         | 33254                    |
| query15   | 474                           | 1414                     |
| query16   | 366                           | 402                      |
| query17   | 1097                          | 2371                     |
| query18   | 581                           | 760                      |
| query19   | 283                           | 308                      |
| query20   | 137                           | 117                      |
| query21   | 110                           | 94                       |
| query22   | 1996                          | 2481                     |
| query23   | 44826                         | 77381                    |
| query24   | 9873                          | 23910                    |
| query25   | 666                           | 1021                     |
| query26   | 221                           | 213                      |
| query27   | 490                           | 544                      |
| query28   | 4089                          | 4593                     |
| query29   | 768                           | 1024                     |
| query30   | 313                           | 682                      |
| query31   | 1847                          | 2252                     |
| query32   | 71                            | 68                       |
| query33   | 460                           | 539                      |
| query34   | 629                           | 638                      |
| query35   | 1660                          | 10505                    |
| query36   | 412                           | 441                      |
| query37   | 94                            | 86                       |
| query38   | 8804                          | 8379                     |
| query39   | 606                           | 898                      |
| query40   | 164                           | 190                      |
| query41   | 55                            | 30                       |
| query42   | 115                           | 113                      |
| query43   | 804                           | 1332                     |
| query44   | 1509                          | 1520                     |
| query45   | 1678                          | 1306                     |
| query46   | 1196                          | 2167                     |
| query47   | 2812                          | 3859                     |
| query48   | 559                           | 1419                     |
| query49   | 646                           | 725                      |
| query50   | 757                           | 1299                     |
| query51   | 6380                          | 4954                     |
| query52   | 128                           | 123                      |
| query53   | 396                           | 391                      |
| query54   | 388                           | 8212                     |
| query55   | 124                           | 124                      |
| query56   | 360                           | 434                      |
| query57   | 1811                          | 2494                     |
| query58   | 304                           | 666                      |
| query59   | 5758                          | 7432                     |
| query60   | 474                           | 481                      |
| query61   | 486                           | 536                      |
| query62   | 647                           | 1082                     |
| query63   | 358                           | 303                      |
| query64   | 3250                          | 4968                     |
| query65   | 5410                          | 5971                     |
| query66   | 484                           | 603                      |
| query67   | 26347                         | 34052                    |
| query68   | 1422                          | 1428                     |
| query69   | 654                           | 808                      |
| query70   | 2285                          | 4462                     |
| query71   | 650                           | 1006                     |
| query72   | 4324                          | 4717                     |
| query73   | 500                           | 558                      |
| query74   | 6678                          | 14127                    |
| query75   | 3734                          | 6312                     |
| query76   | 1835                          | 1870                     |
| query77   | 382                           | 496                      |
| query78   | 19923                         | 23091                    |
| query79   | 3061                          | 4090                     |
| query80   | 851                           | 1559                     |
| query81   | 565                           | 960                      |
| query82   | 242                           | 221                      |
| query83   | 254                           | 415                      |
| query84   | 203                           | 131                      |
| query85   | 364                           | 444                      |
| query86   | 651                           | 931                      |
| query87   | 8972                          | 8554                     |
| query88   | 4095                          | 5202                     |
| query89   | 508                           | 480                      |
| query90   | 233                           | 322                      |
| query91   | 174                           | 159                      |
| query92   | 62                            | 59                       |
| query93   | 1601                          | 1618                     |
| query94   | 297                           | 297                      |
| query95   | 1240                          | 27354                    |
| query96   | 508                           | 847                      |
| query97   | 5449                          | 11528                    |
| query98   | 382                           | 287                      |
| query99   | 1410                          | 2147                     |
| **Total** | **264028**                    | **487990**               |

## 6. 环境准备

请先参照 [官方文档](../install/standard-deployment.md) 进行 Doris 的安装部署，以获得一个正常运行中的 Doris 集群（至少包含 1 FE 1 BE，推荐 1 FE 3 BE）。

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

> 注1：通过 `sh gen-tpcds-data.sh -h` 查看脚本帮助。
>
> 注2：数据会以 `.dat` 为后缀生成在  `tpcds-data/` 目录下。文件总大小约1000GB。生成时间可能在数分钟到1小时不等。
>
> 注3：默认生成 100G 的标准测试数据集

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

你也可以从代码库里获取最新的 SQL 。最新测试查询语句地址：[TPC-DS 测试查询语句](https://github.com/apache/doris/tree/master/tools/tpcds-tools/queries/sf1000)

