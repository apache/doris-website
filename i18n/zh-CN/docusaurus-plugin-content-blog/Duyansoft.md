---
{
    'title': '复杂查询响应速度提升10+倍，度言软件基于 Apache Doris 实时数仓建设实践',
    'summary': '度言软件使用 Doris 替换了部分业务使用场景后，用户的产品使用体验有了进一步提升，页面打开更加流畅，原本因为查询慢而不能实现的功能，当前已经实现并上线使用。同时在资源成本上也减轻了 MySQL 和 MongoDB 数据库的压力，不需要频繁进行升配和磁盘升级。,
    'date': '2023-02-27',
    'author': '杭州度言软件大数据团队',
    'tags': ['最佳实践'],
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

作者 | 杭州度言软件大数据团队

编辑整理：SelectDB

杭州度言软件有限公司（度言软件）成立于2014年，是信贷不良资产处置技术服务供应商，以“智能科技赋能不良资产处置，推动贷后行业合规高效发展”为使命，运用云通讯、大数据、人工智能等智能科技为信贷不良资产处置业务赋能，提供贷后管理通信能力支撑，实现了催收作业的智能化管理，客户群体为银行、消费金融公司、AMC 等金融机构和为这些机构提供人力资源外包服务的相关公司，目前已拥有 2000 多家企业客户。

度言软件以围绕信贷不良资产案件高效流转管理为目的核心，从机构管理、团队管理、坐席管理、外呼作业、调解法诉等环节入手，帮助客户构建数智化的业务管理体系，以数字化系统提升管理效能、以智能化工具赋能处置作业，打通金融机构、外包服务公司、司法系统等多方的业务系统，并按照监管要求**对外呼行为、录音文件、沟通记录等案件相关数据进行记录、汇集、稽核、统计和分析，具有海量账号同时登陆、数据请求高并发、多来源数据汇总接入的特点要求。**

# 业务需求

2021 年之前，度言软件旗下产品的数据需求主要由传统数据库 MySQL，MongoDB，ElasticSearch 为主的技术架构来实现，近两年随着业务不断发展带而来数据量的高速增长，传统的数仓技术架构已初显瓶颈，难以满足客户日益丰富多样化的数据及分析需求。为了给客户提供更优质的服务体验，度言软件亟需对现有的技术架构做出优化和重构。

# 早期架构及痛点

## 数仓架构 1.0 版本

初创期间，由于公司业务量相对较少，主要还是以 OLTP 业务和少量的业务报表服务为主，并且对于数据分析方面的需求也很少，仅通过传统的数据库基本就能满足早期的业务数据需求。**数仓** **架构 1.0 如下图所示：**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b90115e4f1124a7480f095c113412dce~tplv-k3u1fbpfcp-zoom-1.image)

## 数仓架构 2.0 版本

随着公司业务的不断扩展，数据体量也出现极速增长的态势，业务侧对于数据分析方面的需求也逐渐多了起来，为此我们成立了专门的大数据团队，为搭建新的数仓及业务数据分析需求进行服务。**如下图所示为数仓架构 2.0** ：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8556d98d920445ffa9290843aff41e4e~tplv-k3u1fbpfcp-zoom-1.image)

数仓架构 2.0 版本是基于 MaxCompute + Hologres/MySQL 来搭建的。数据来源主要有 MySQL 和 MongoDB 的业务数据以及埋点日志数据；数据首先采集到数据总线 DataHub 中，后经过 DataHub 直接导入到 MaxCompute，MaxCompute 作为一个离线数仓，我们将其进行了传统的数仓分层；数据的加工处理和分析计算主要在离线数仓中进行，并将计算好的结果导出到 MySQL中，来对接 QuickBI 展示报表。此外，我们还尝试了将 Hologres 用作实时数仓，作为 MongoDB 的替换方案，用于业务上的查询系统。

## 早期架构存在的问题：

1.  **响应速度较慢**。MySQL 对于大表的聚合计算并不友好，响应速度较慢。产品侧要求数据查询响应时间在 5 秒以内，虽然我们也基于 MySQL 进行了许多优化，但优化效果十分有限，仍无法达到 5s 的响应要求；我们甚至尝试了直接用 MaxCompute 对接 QuickBI，希望基于 MaxCompute 的查询加速和 QuickBI 的缓存来帮助我们解决问题，然而结果并不理想。
1.  **维系维度表成本高、难度大。** 离线数仓在数据同步的时效性上并不占优势(每 5 分钟进行一次批量同步)，因此不太适合数据频繁更新和删除的场景，同时也给维度表的维护带来了额外的工作量。在数据更新和删除场景中，我们需要定期通过过滤和去重来保持数据的一致性，而事实上，大多时候需要报表数据实时关联维度表，这让我们直接放弃了在离线数仓中维系维度表的方案。
1.  **不支持高并发点查询场景。** 原实时数仓虽然可以满足我们对数据分析的部分性能要求，但其对高并发的点查场景并不太友好，不管是采用列式存储还是行级存储建表，优化之后的响应时长在 500 毫秒左右，综合来看性价比不算太高。

# 解决思路

为了解决上述问题，我们希望理想数仓能具有如下特性：

1.  实现一站式实时数仓，能同时满足多种不同业务数据需求，大大简化大数据架构体系；
1.  可同时支持 OLAP，Ad-hoc 和高 QPS 点查场景；
1.  数据接入友好，写入即可见，对数据增删改和聚合等都有较好的支持；
1.  架构简单，运维部署和维护简单，有较好的监控体系。

# 技术选型

在 2022 年 3 月份，我们对市场上主流的的几款即席查询数据库进行了调研，调研中我们发现每个产品只能满足某 1 个或几个特定的使用场景，没有一个产品可以完全满足所有的选型要求，而同时采用多个产品，将大大增加开发运维成本，同时也会使架构变得更加庞大复杂，这并不符合我们对理想数仓的要求。

正在这时，我们从开源社区、技术媒体等渠道了解到了[ Apache Doris](https://github.com/apache/doris) ，经初步调研，我们发现 Doris 基本可以满足我们对理想数仓的所有要求。接着我们对 Doris 展开了深入调研，并使我们最终决定使用 Doris：Doris 架构非常简单，只有 FE 和 BE 两类进程，这两类进程都可以进行横向扩展，单集群可以支持到数百台机器、数十 PB 的存储容量，并且这两类进程通过一致性协议来保证服务的高可用和数据的高可靠。这种高度集成的架构设计极大的降低了分布式系统的运维成本，同时也不需要依赖于 Hadoop，避免了我们需要投入成本来额外部署 Hadoop 集群。

# 基于 Doris 的新数仓架构设计

最初使用 Doris 的初衷是替换部分 MySQL 数据量较大的报表，基于 MySQL 的查询约需要几十秒的响应时间，在替换为 Doris 后，查询性能有了显著提升，几秒内即可返回结果，最长的 SQL 执行时间大概在 8 秒左右，速度相较于之前提升了8 倍。Doris 的初步应用就给了我们一个意外的惊喜，因此我们决定使用 Doris 完全替换掉早期数仓中的 MySQL，在这使用过程中，我们又发现 Doris 远比我们想象的要强大，目前已将客户报表及公司内部运营决策数据全部迁移至 Apache Doris，并计划用 Apache Doris 来替换 MongoDB 和 ElasticSearch，用于业务上高 QPS 的点查场景。**以下是基于 Doris 的新数仓架构设计及使用情况：**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9ee756d4fef24d07875b14855ff91f63~tplv-k3u1fbpfcp-zoom-1.image)

## **数据建模：**

我们在业务上使用最多的是 Unique 模型和 Aggregate 模型，这两种模型基本能够满足业务需求。

-   Unique 模型主要用于维度表和业务表(原始表)的接入，确保数据导入过程中的一致性。
-   Aggregate主要用于报表数据的导入，Aggregate 分为 Key (维度列) 和 Value（指标列），Value 列支持四种聚合方式：`sum` ,`replace`,`max`,`min`。当前主要以`replace` 聚合方式为主，方便统计数据重复导入和修正结果，后续也会尝试更多的方式来充分发挥 Doris 的性能。

### **数据接入：**

1.  使用 Flink-Doris-Connector 进行实时导入：主要用于业务数据的导入，基于MySQL 的 Binlog 日志写入到 Kafka 后，通过 Flink 解析加工后准实时写入 Doris。
1.  使用 DataX 进行离线导入：主要用于对接离线数仓已计算后的报表数据。

### **数据开发：**

目前 Doris 主要以提供终端查询为主，复杂的 SQL 开发任务运行比较少，为尽可能减少 Doris 在数据加工方面的资源消耗，当前仅有报表集群在凌晨执行少量的 SQL 任务，主要以 Doris SQL 通过 insert into 的方式来导入。

### **数据管理：**

Doris 支持将当前数据以文件的形式通过 Broker 备份到远端存储系统中，后可以通过恢复命令从远端存储系统中将数据恢复到任意 Doris 集群。通过该功能，Doris 可支持定期对数据进行快照备份，也可以通过该功能在不同集群间进行数据迁移。我们也会定期将集群数据备份到阿里云 OSS 上，作为备用数据恢复方案。另外，在这期间我们对 Doris 集群进行了一次拆分，将报表集群和业务上的高并发查询集群分开，采用了 Doris 的数据备份和迁移功能。

### **监控和报警：**

我们使用官网推荐的 Prometheus 和 Grafana 进行监控项的采集和展示，Doris 本身提供了丰富的监控指标和标准监控模版，可以非常便捷地对 Doris 集群使用情况进行监控和报警。

另外，为了进一步对慢 SQL 进行优化，我们还部署了审计日志插件，对于特定用户和特定的慢 SQL 进行优化和资源限制。如下是我们日常使用中的一些指标：

**慢 SQL 查询：**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/96037a4c50314c0dbfefd6c63855fac8~tplv-k3u1fbpfcp-zoom-1.image)

对于一些长文本 SQL，无法完全展示，可以进一步查看`fe.audit.log`。

**主要查询统计指标：**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f0e838af4538449aa3fed993d3ea982f~tplv-k3u1fbpfcp-zoom-1.image)

# 优化实践：

## 提高并发

我们考虑在资源给定的情况下，如何最大程度地提高并发。刚开始引入 Doris 集群的时候，我们尝试对复杂 SQL 进行压测（SQL 层面优化已完成），但始终无法达到预期的压测效果。后来我们尝试**调低** `parallel_fragment_exec_instance_num` **的值**，顺利完成了压测目标。

> **需要说明的是：**
>
> ` parallel_fragment_exec_instance_num  `指的是 Scan Node 在每个 BE 节点上执行实例的个数，相当于在整个查询计划执行过程中的并发度，调高该参数可以提升查询效率，但同时也会增加更多机器资源的消耗。因此在资源有限且查询耗时满足业务需求的情况下，通过调低参数来节省单个 SQL 的资源消耗，有助于提高并发表现。另外，我们通过 Doris 社区了解到，在即将发布的新版本中将实现参数自动设置，无需进行手动调整。

如下图，我们可以看到，在参数设置为 16 的时候，异常率高达 82.84%，并且期间还出现了 BE 宕机重启，将参数调低至 8 后，异常率也同步降低到了 27.66%。最后我们将参数设置为最小值 1 后，异常率为 0，查询响应也能达到预期目标。

说明：测试环境已重新取数，配置较低，数据仅用来说明 `parallel_fragment_exec_instance_num` 变动所带来的效果。

当参数调整为 1：`parallel_fragment_exec_instance_num = 1`

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b34b8b88a4454d8c903bc682d14b8248~tplv-k3u1fbpfcp-zoom-1.image)

当参数调整为 8：`parallel_fragment_exec_instance_num = 8`

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/082a039e65404dbfbd836b5eaa55f45e~tplv-k3u1fbpfcp-zoom-1.image)

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fda87b9110ac45e09091051138bd6b22~tplv-k3u1fbpfcp-zoom-1.image)

当参数调整为 16：`parallel_fragment_exec_instance_num = 16`

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3ec04a8265644ff0a2440c9499998b89~tplv-k3u1fbpfcp-zoom-1.image)

## BE 内存问题

最初我们使用的是 Doris 0.15 的版本。由于刚开始处于测试阶段，Doris 集群配置比较低或参数配置的不合理，当某些 SQL 扫描数据量较大时，就可能因为内存问题导致 BE 宕机。

在向社区咨询后，了解到 Supervisor 是用 Python 开发的一套通用的进程管理程序，能将一个普通的命令行进程变为后台 Daemon，并监控进程状态，异常退出时能自动重启，因此我们参照官网给出的例子直接用 Supervisor 对 Doris 的 FE 和 BE 进程进行管理。

但是在运行了一段时间后，新的问题又出现了(已升级到 1.1.0 版本)。Doris 的 BE 节点内存一直在缓慢上升状态，并且达到了设置的最大内存参数 80% 后仍在继续上涨。后经分析发现 BE 存在内存泄漏问题，因此设置的参数并未生效。为此，我们将 Supervisor 切换为 Systemd 来守护 FE、BE 进程，限制整个节点的内存使用上限。不过在 Doris 1.1.3 推出之后，此问题已得到彻底的修复。

## 资源占用

在迁移完新集群后，我们发现通过 Flink-Doris-Connector 数据导入占用非常高的集群资源，虽然设置了按批次写入(每 3s 写入一次 )，以限制数据的导入频率，但集群资源的占用仍未得到较大改善。因此我们在集群资源和数据实时可见性方面做了权衡，介于我们对数据实时性的要求相对不是太高，所以我们将每 3s 写入一次改为每 10s 或 20s 写入一次，调整写入时间后，集群的 CPU 资源占用下降明显，得到改善。

# 应用现状

目前度言软件有 2 个 Doris 集群，1 个集群用作线上业务的查询系统，主要是应对高 QPS 的点查场景，我们将原先基于业务库 MySQL 和 MongoDB 的查询迁移至 Doris，一方面减少了业务库的读写压力，同时也提高了用户查询服务的使用体验。在 Doris 中，最复杂的查询在 1 秒以内即可响应，响应速度提升了十几倍；另外 1 个集群主要用作即席查询(AD-Hoc Query)和报表分析，具体包括公司内部使用的所有报表和一些临时查询、客户报表、数据实时大屏。

总而言之，使用 Doris 替换了部分业务使用场景后，用户在产品上的使用体验有了进一步得到提升，页面打开更加流畅，原本因为查询慢而不能实现的功能，当前已经实现并上线使用。同时在资源成本上也减轻了 MySQL 和 MongoDB 数据库的压力，不需要频繁进行升配和磁盘升级。

# 总结规划

## 效果总结

1.  Doris 完美覆盖了原本需要多个技术栈才能实现的业务场景，极大地简化了大数据的架构体系。
1.  Doris 对 Join 支持较好，因此我们选择了将维度表放到 Doris 中进行维护，相较于之前在离线数仓中进行维护，明显地提高了开发的效率，并降低了数据出错的可能性，满足了业务上对维度表近实时更新的需求。
1.  Doris 支持 MySQL 协议和标准 SQL，开发人员学习成本低，上手简单，可以快速将原先的业务迁移至 Doris 上来。
1.  Doris 社区活跃，版本迭代速度快。在遇到任何问题时，都可以向社区求助，[SelectDB](https://cn.selectdb.com/) 为 Apache Doris 组建了一支全职专业的技术支持入队，24H 内即可得到社区的响应回复。

## 未来规划

到目前为止，基于 Doris 的实时数仓搭建已基本完成，但我们对 Doris 的进一步尝试才刚刚开始，比如 BE 的多磁盘部署，物化视图的使用，Doris-On-ES，Doris 多租户和资源划分等。

**此外，我们也希望 Doris 未来能对以下功能进行进一步优化：**

1.  Flink-Doris-Connector 能支持单 Sink 同时写入多张表，不需要再通过分流后多个 Sink 写入。
1.  物化视图能够支持多表 Join，不再局限于单表。
1.  进一步优化数据的底层 Compaction，在保证数据可见性的同时能够尽可能降低资源消耗。
1.  Doris-Manager 提供对慢 SQL 的优化建议以及表信息收集，对于不合理的建表进行一定的提示。

  


从 3 月份使用 Doris 以来，我们一直都和 Doris 社区保持着密切的联系，后续我们也将继续围绕 Doris 作为实时数仓应用到更多的业务使用场景中，对于使用中遇到的问题和优化的方案，我们也会持续和社区保持热切联系，为社区进步贡献我们的一份力量。

