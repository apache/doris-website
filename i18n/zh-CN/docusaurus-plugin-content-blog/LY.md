---
{
    'title': '应用实践：数仓体系效率全面提升！同程数科基于 Apache Doris 的数据仓库建设',
    'language': "zh",
    'summary': "同程数科成立于 2015 年，是同程集团旗下的旅游产业金融服务平台。2020 年，同程数科由于看到了 Apache Doris 丰富的数据接入方式、优异的并行运算能力和极简运维的特性，引入了Apache Doris 进行数仓架构改造。本文详细讲述了同程数科数仓架构从1.0 到 2.0 的演进过程及使用Doris过程中的应用实践。",
    'date': '2022-12-19',
    'author': '王星',
    'tags': ['最佳实践']
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

> 导读：同程数科成立于 2015 年，是同程集团旗下的旅游产业金融服务平台。2020 年，同程数科由于看到了 Apache Doris 丰富的数据接入方式、优异的并行运算能力和极简运维的特性，引入了Apache Doris 进行数仓架构改造。本文详细讲述了同程数科数仓架构从1.0 到 2.0 的演进过程及使用Doris过程中的应用实践。希望对大家有所帮助。

> 作者｜同程数科大数据高级工程师 王星

![kv](/images/LY/zh/kv.png)

# 业务背景

## 业务介绍
同程数科是同程集团旗下的旅游金融服务平台，其前身是同程金服。正式成立于 2015 年，同程数科以“数字科技引领旅游产业”为愿景，坚持以科技的力量，赋能我国旅游产业。
目前，同程数科的业务涵盖金融服务、消费金融服务、金融科技及数字科技等板块，累计服务覆盖超过千万用户和 76 座城市。

## 业务需求

包含四大类：
- 看板类：包括实时驾驶舱以及 T+1 业务看板等。
- 预警类：包括风控熔断、资金异常以及流量监控等。
- 分析类：包括及时性数据查询分析以及临时取数等。
- 财务类：包括清算以及支付对账需求。

# 架构演进之 1.0

## 工作流程

![1](1.png)

我们最初的数仓架构沿袭了前几年非常流行的SteamSets 和 Apache Kudu 组合的第一代架构。该架构中，Binlog 通过StreamSets后，通过实时采集后写入 Apache Kudu 中，最后通过 Apache Impala 和可视化工具进行查询和使用。

不足：
- 组件引入过多，维护成本随之增加
- 多种技术架构和过长的开发链路，提高了数仓研发人员的学习成本，数仓人员需要在不同组件之间进行开发，导致开发效率降低。
- Apache Kudu 在大表关联 Join 方面性能差强人意。
- 由于数仓使用了 CDH组件搭建，离线和实时集群并未进行分离，形成资源之间的相互竞争；在离线数据批量处理时对 IO 或磁盘消耗较大，无法保证实时数据的及时性。
- 虽然 SteamSets 配备了预警能力，但作业恢复能力仍相对欠缺。在配置多个任务时， JVM 的消耗较大，导致恢复速度较慢。

# 架构演进之 2.0

## 调研过程

由于缺点众多，我们不得不放弃了数仓1.0的架构。在 2020年中，我们对市面上流行的数仓进行了深度调研。

在调研过程中，我们集中对比了Click house和Apache Doris。ClickHouse 对 CPU 的利用率较高，所以在单表查询时表现比较优秀，但是在多查询高 QPS 的情况下则表现欠佳。反观Doris不仅单节点最高可支持上千QPS，而且得益于分区分桶裁剪的功能，可以支持QPS万级别的高并发查询；再者，ClickHouse的扩容缩容复杂且繁琐，目前做不到自动在线操作，需要自研工具支持。Doris支持集群的在线动态扩缩容，且可以随着业务的发展水平扩展。

在调研中，ApacheDoris脱颖而出。Doris高并发的查询能力非常吸引我们，而且灵活的扩缩容能力也也更适合我们灵活多变的广告业务。因此我们选择了 Apache Doris。

![2](/images/LY/zh/2.png)

引入 Apache Doris 后，我们对整个数仓进行了改造：
- 通过Canal 采集MySQL Binlog 进入 Kafka中。因为Apache Doris 与 Kafka 的契合度较高，可以便捷地使用 Routine Load 对数据加载和导入。
- 我们对原有离线计算的数据链路进行了细微调整。对于存储在 Hive 中的数据，Apahce Doris 可以通过 Broker Load 将 Hive 中的数据导入。这样一来离线集群的数据就可以直接加载到 Doris。

## 选择 Doris

![3](/images/LY/zh/3.png)

Apache Doris 整体表现令人深刻：
- 数据接入：提供了丰富的数据导入方式，能够支持众多数据源的接入。
- 数据连接：Doris 支持 JDBC 与 ODBC 等方式连接。Doris对 BI 工具的可视化展示比较友好，能够便捷地与 BI 工具进行连接。另外Doris 采用MySQL 协议进行通信，用户可以通过各类 Client 工具直接访问 Doris。
- SQL 语法：Doris 采用MySQL 协议，高度兼容MySQL 语法，支持标准SQL，对于数仓开发人员来说学习成本较低；
- MPP 并行计算：Doris 基于 MPP 架构，提供了非常优秀的并行计算能力。在复杂Join和大表Join的场景下Doris优势非常明显；
- 文档健全：Doris 官方文档非常健全，对于新用户上手非常友好。（我们最看重的一点）

## Doris 实时系统架构

![4](/images/LY/zh/4.png)

- 数据源：在实时系统架构中，数据源来自产业金融、消费金融、风控数据等业务线，通过 Canal 和 API 接口进行采集。

- 数据采集：通过 Canal- Admin 进行数据采集后，Canal将数据发送到 Kafka 消息队列之中。之后，数据再通过 Routine Load 接入到 Doris 集群。

- Doris 数仓：由Doris 集群组成了了数据仓库的三级分层，分别是：使用了 Unique 模型的 DWD 明细层 、 Aggregate 模型的 DWS 汇总层以及 ADS 应用层。

- 数据应用：数据应用于实时看板、数据及时性分析以及数据服务三方面。

## Doris 新数仓特点

数据导入方式简便，根据不同场景采用 3 种不同的导入方式：
- Routine Load：当我们提交 Rountine Load 任务时，Doris 内部会有一个常驻进程实时消费 Kafka ，不断从 Kafka 中读取数据并导入进 Doris中。
- Broker Load：维度表及历史数据等离线数据有序地导入Doris。
- Insert Into：用于定时批式计算任务，负责处理DWD 层数据，从而形成 DWS 层以及 ADS 层。
Doris 的良好数据模型，提升了我们的开发效率：
- Unique 模型在 DWD 层接入时使用，可以有效防止重复消费数据。
- Aggregate 模型用作聚合。在 Doris 中，Aggregate 支持如 Sum、Replace、Min 、Max 4 种方式的聚合模型，聚合的过程中使用 Aggregate 底层模型可以减少很大部分 SQL 代码量，不再人工手写Sum、Min、Max 等代码。
Doris 查询效率高：
- 支持物化视图与 Rollup 物化索引。物化视图底层类似 Cube 的概念与预计算的过程，与 Kylin 中以空间换时间的方式类似，均是在底层生成特殊的表，在查询中命中物化视图并快速响应。

# 新架构的收益

- 数据接入：在最初的架构中，通过 SteamSets 进行数据接入的过程中需要手动建立 Kudu 表。由于缺乏工具，整个建表和创建任务的过程需要 20-30 分钟。如今可以通过平台与快速构建语句实现数据快速接入，每张表的接入过程从之前的20-30分钟缩短到现在的 3-5 分钟，性能提升了 5-6 倍。
- 数据开发：使用 Doris之后，我们可以直接使用 Doris 中自带的 Unique、Aggregate 等数据模型及可以很好支持日志类场景的 Duplicate 模型，在 ETL 过程中大幅度加快开发过程。
- 查询分析：Doris 底层带有物化视图及 Rollup 物化索引等功能。物化视图底层类似 Cube 的概念与预计算的过程，与 Kylin 中以空间换时间的方式类似，均是在底层生成特殊的表，在查询中命中物化视图并快速响应。同时 Doris 底层对于大表关联进行了诸多优化，如 Runtime Filter 以及其他 Join 和自定义优化。相较于 Doris，Apache Kudu 则需要经过更为深入和复杂的优化才能更好地使用。
- 数据报表：我们最初使用 Kudu 报表查询需要 1-2 分钟才能够完成渲染，而 Doris 则是秒级甚至是毫秒级的响应速度。
- 便捷运维：Doris 没有 Hadoop 生态系统的复杂度，维护成本远低于 Hadoop。尤其是在集群迁移过程中，Doris 的运维便捷性尤为突出。3 月份，我们的机房进行了搬迁，12 台 Doris 节点机器在三天内全部迁移完成。整体操作较为简单，除了机器上架下架和搬移外，FE 扩容与缩容时只运用了 Add 与 Drop 等简单指令，并未消耗太长时间。

# 未来展望

- 实现基于 Flink CDC 的数据接入：当前，优化后的数据库架构中并没有没有引入 Flink CDC ，而是继续沿用了 数据经Canal 采集到 Kafka 后再采集到 Doris 中的模式，链路相对来说较长。使用Flink CDC 虽然可以继续精简整体架构，但是还需要写一定量的代码，这对于数据分析师直接使用感受并不友好。我们希望数据分析师只需要写简单SQL 或在页面上直接操作。在未来的规划中，我们计划引入 Flink CDC 功能并对上层应用进行扩充。
- 紧跟社区迭代计划：我们正在使用的 Doris 版本相对较老，现在的最新版本 Apache Doris V1.2.0在全面向量化、multi-catalog多元数据目录、light schema change轻量表结构变更方面有了较大幅度的提升。我们将紧跟社区迭代节奏对集群进行升级并充分利用新特性。
- 强化建设相关体系：我们现在的指标体系管理如报表元数据、业务元数据等维护与管理水平依旧有待提高。在数据质量监控方面，虽然目前包含了数据质量监控功能，但对于整个平台监控与数据自动化监控方面还需要强化与改善。