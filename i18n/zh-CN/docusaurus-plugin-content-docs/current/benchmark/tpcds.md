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

在 TPC-DS 标准测试数据集上的 99 个查询上，我们基于 Apache Doris 进行了测试。

## 1. 硬件环境

| 硬件   | 配置说明                                     |
|------|------------------------------------------|
| 机器数量 | 4 台[阿里云g9i实例](https://help.aliyun.com/zh/ecs/user-guide/general-purpose-instance-families#g9i)（1 个 FE，3 个 BE）                  |
| CPU  | Intel® Xeon® Granite Rapids 32 核 |
| 内存   | 128G                                     |
| 磁盘   | 阿里云 ESSD (PL0)                           |

## 2. 软件环境

- Doris 部署 3BE 1FE
- 内核版本：Linux version 5.15.0-101-generic 
- 操作系统版本：Ubuntu 20.04 LTS (Focal Fossa)
- JDK：openjdk 17.0.2

## 3. 测试数据量

整个测试模拟生成 TPC-DS 1000G 的数据分别导入到 Apache Doris 进行测试，下面是表的相关说明及数据量。

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

| Query     | Doris 2.1.11 (ms) | Doris 3.1.4 (ms) | Doris 4.0.5 (ms) | Doris 4.1.0 (ms) |
|-----------|-------------------|------------------|------------------|------------------|
| **Total** | **185200**        | **190159**       |**190031**        | **159562**       |
| query01   | 420               | 491              | 541              | 459              |
| query02   | 2970              | 3058             | 2510             | 589              |
| query03   | 260               | 311              | 397              | 150              |
| query04   | 8000              | 7782             | 7245             | 6046             |
| query05   | 310               | 475              | 786              | 454              |
| query06   | 180               | 245              | 352              | 313              |
| query07   | 310               | 383              | 347              | 390              |
| query08   | 240               | 381              | 365              | 408              |
| query09   | 4670              | 4947             | 4721             | 4158             |
| query10   | 200               | 243              | 328              | 261              |
| query11   | 4600              | 5159             | 4555             | 3815             |
| query12   | 70                | 156              | 127              | 121              |
| query13   | 410               | 435              | 471              | 481              |
| query14_1 | 6230              | 6353             | 6337             | 5365             |
| query14_2 | 5880              | 6276             | 5876             | 5048             |
| query15   | 300               | 291              | 348              | 265              |
| query16   | 390               | 349              | 275              | 245              |
| query17   | 670               | 745              | 838              | 1139             |
| query18   | 410               | 607              | 636              | 682              |
| query19   | 150               | 210              | 295              | 247              |
| query20   | 120               | 160              | 141              | 134              |
| query21   | 50                | 100              | 111              | 87               |
| query22   | 1160              | 936              | 948              | 802              |
| query23_1 | 13670             | 14627            | 12838            | 10419            |
| query23_2 | 13480             | 14103            | 12633            | 10303            |
| query24_1 | 2360              | 2677             | 2776             | 2774             |
| query24_2 | 2320              | 2634             | 2453             | 2616             |
| query25   | 400               | 646              | 671              | 739              |
| query26   | 150               | 212              | 183              | 184              |
| query27   | 300               | 396              | 390              | 327              |
| query28   | 4170              | 4664             | 4260             | 3598             |
| query29   | 520               | 640              | 727              | 721              |
| query30   | 190               | 242              | 236              | 240              |
| query31   | 1150              | 1244             | 1070             | 1283             |
| query32   | 40                | 77               | 114              | 92               |
| query33   | 200               | 310              | 304              | 268              |
| query34   | 370               | 478              | 478              | 286              |
| query35   | 880               | 893              | 842              | 813              |
| query36   | 340               | 357              | 337              | 333              |
| query37   | 100               | 166              | 204              | 81               |
| query38   | 5200              | 2511             | 6593             | 5704             |
| query39_1 | 200               | 284              | 299              | 213              |
| query39_2 | 160               | 220              | 209              | 157              |
| query40   | 100               | 133              | 162              | 140              |
| query41   | 50                | 86               | 118              | 89               |
| query42   | 50                | 90               | 111              | 86               |
| query43   | 690               | 708              | 596              | 326              |
| query44   | 1330              | 1455             | 1344             | 1010             |
| query45   | 300               | 205              | 204              | 196              |
| query46   | 480               | 570              | 698              | 443              |
| query47   | 2770              | 2709             | 2693             | 2123             |
| query48   | 260               | 362              | 362              | 311              |
| query49   | 360               | 511              | 599              | 490              |
| query50   | 490               | 589              | 797              | 330              |
| query51   | 6590              | 6901             | 3266             | 4243             |
| query52   | 60                | 87               | 123              | 91               |
| query53   | 200               | 272              | 270              | 276              |
| query54   | 870               | 1083             | 1143             | 244              |
| query55   | 50                | 78               | 96               | 84               |
| query56   | 150               | 245              | 293              | 258              |
| query57   | 1580              | 1553             | 1592             | 1180             |
| query58   | 150               | 226              | 245              | 246              |
| query59   | 3960              | 4047             | 3475             | 1648             |
| query60   | 200               | 263              | 318              | 296              |
| query61   | 200               | 294              | 329              | 299              |
| query62   | 590               | 694              | 758              | 421              |
| query63   | 180               | 226              | 287              | 232              |
| query64   | 3220              | 2101             | 2687             | 2679             |
| query65   | 3270              | 3472             | 3308             | 3101             |
| query66   | 350               | 381              | 359              | 328              |
| query67   | 27490             | 26838            | 26040            | 22313            |
| query68   | 390               | 421              | 698              | 270              |
| query69   | 180               | 272              | 742              | 700              |
| query70   | 2350              | 2167             | 2117             | 2158             |
| query71   | 510               | 847              | 811              | 754              |
| query72   | 2160              | 2393             | 3269             | 2215             |
| query73   | 290               | 331              | 391              | 122              |
| query74   | 3990              | 4117             | 3918             | 3183             |
| query75   | 3150              | 3450             | 3099             | 3115             |
| query76   | 1110              | 1122             | 1224             | 969              |
| query77   | 180               | 233              | 288              | 219              |
| query78   | 10450             | 11343            | 10591            | 9480             |
| query79   | 1580              | 1923             | 2008             | 1336             |
| query80   | 330               | 411              | 579              | 463              |
| query81   | 320               | 365              | 406              | 348              |
| query82   | 210               | 259              | 427              | 154              |
| query83   | 140               | 161              | 176              | 181              |
| query84   | 90                | 120              | 187              | 145              |
| query85   | 300               | 537              | 770              | 769              |
| query86   | 660               | 652              | 698              | 726              |
| query87   | 5280              | 3039             | 6885             | 6258             |
| query88   | 3670              | 3786             | 4114             | 3209             |
| query89   | 330               | 359              | 410              | 437              |
| query90   | 130               | 149              | 188              | 128              |
| query91   | 100               | 118              | 204              | 183              |
| query92   | 30                | 54               | 70               | 86               |
| query93   | 1090              | 1174             | 1247             | 973              |
| query94   | 250               | 240              | 344              | 166              |
| query95   | 260               | 330              | 374              | 207              |
| query96   | 440               | 475              | 581              | 345              |
| query97   | 3630              | 3785             | 2753             | 2738             |
| query98   | 240               | 453              | 410              | 379              |
| query99   | 1170              | 1420             | 1612             | 853              |


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
> 注 3：默认生成 SF100 的标准测试数据集

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


## 8 查询测试

### 8.1 执行查询脚本

单个 SQL 执行 或者 执行下面的命令

```shell
sh bin/run-tpcds-queries.sh -s 1000
```

### 8.2 单个 SQL 执行

你也可以从代码库里获取最新的 SQL。最新测试查询语句地址：[TPC-DS 测试查询语句](https://github.com/apache/doris/tree/master/tools/tpcds-tools/queries/sf1000)

