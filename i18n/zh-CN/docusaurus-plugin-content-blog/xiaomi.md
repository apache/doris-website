---
{
    'title': 'Apache Doris 在小米集团的运维实践',
    'summary': "为了提高小米增长分析平台的查询性能以及降低平台的运维成本，2019 年 9 月小米集团引入了 Apache Doris。在过去两年多的时间里，Apache Doris 在小米集团得到了广泛的应用，目前已经服务了增长分析、集团数据看板、天星金融、小米有品、用户画像、广告投放、A/B 实验平台、新零售等数十个业务。在小米集团，质量就是生命线，随着业务持续增长，如何保障线上 Apache Doris 集群的服务质量，对集群的运维人员来说是个不小的挑战。本文将从运维的角度对 Apache Doris 在小米集团的应用实践进行分享.",
    'date': '2022-07-20',
    'author': 'Apache Doris',
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

# 背景

为了提高小米增长分析平台的查询性能以及降低平台的运维成本，2019 年 9 月小米集团引入了 Apache Doris。在过去两年多的时间里，Apache Doris 在小米集团得到了广泛的应用，目前已经服务了增长分析、集团数据看板、天星金融、小米有品、用户画像、广告投放、A/B 实验平台、新零售等数十个业务。在小米集团，质量就是生命线，随着业务持续增长，如何保障线上 Apache Doris 集群的服务质量，对集群的运维人员来说是个不小的挑战。本文将从运维的角度对 Apache Doris 在小米集团的应用实践进行分享。 

# 集群部署和升级

基于 Apache Doris 社区发布的稳定版本，小米也维护了内部的 Doris 分支用于内部小版本的迭代。由于和社区编译 Docker 第三方库的硬件环境存在差异，基于社区 Docker 编译出的 Doris 二进制包运行在小米的线上环境会有问题，因此小米内部也维护了自己的 Docker 镜像，用于内部 Doris 分支的编译及发版。内部发版时，在 Docker 容器中会完成源码的编译和打包，并通过 Minos 将二进制包上传到 Tank Server（小米内部的版本仓库）。

Minos 是小米自研并开源的一款基于命令行的大数据部署和进程管理系统，支持 Doris、HDFS、HBase、Zookeeper 等服务的部署和管理。在小米内部，包上传、集群部署、集群下线、集群升级、进程重启、配置变更等操作都可以通过 Minos 完成， Minos 对于服务的管理依赖于配置文件 deployment-config ，其中配置了服务版本信息、集群的节点信息、集群的配置参数等信息。部署集群时，Minos 会根据 deployment-config 中配置的服务版本信息从 Tank Server 上拉取对应的二进制包，并根据 deployment-config 中配置的节点信息和集群参数部署集群。在集群部署之后，如果进程意外挂掉，Minos 会自动拉起进程，恢复服务。

轻舟是小米自研的分布式服务生命周期管理平台，贯穿分布式大数据系统从需求评估开始到资源下线结束的生命周期互联互通管理，主要由发布中心、巡检中心、运营数仓、环境管理、故障管理、容量管理等组成，各模块之间逻辑互联、数据互通。轻舟发布中心提供了可编排、低代码、可视化的服务发布和进程管理能力。轻舟发布中心底层依赖 Minos ，因此，可以基于轻舟对 Doris 服务实现平台化管理，包括集群部署、集群下线、集群升级、进程重启、配置变更等操作，如果 Doris 的 FE 或 BE 进程意外挂掉，轻舟会自动拉起进程，恢复服务。

# 业务实践

Apache Doris 在小米的典型业务实践如下：

## 01  用户接入 

数据工场是小米自研的、面向数据开发和数据分析人员的一站式数据开发平台，底层支持 Doris、Hive、Kudu、Iceberg、ES、Talso、TiDB、MySQL 等数据源，同时支持 Flink、Spark、Presto 等计算能力 。

在小米内部，用户需要通过数据工场接入 Doris 服务，用户需要在数据工场进行注册，并完成建库审批， Doris 运维同学会根据数据工场中用户提交的业务场景、数据使用预期等描述进行接入审批和指导，用户完成接入审批后即可使用 Doris 服务，在数据工场中进行可视化建表和数据导入等操作。

## 02  数据导入

在小米的业务中，导入数据到 Doris 最常用的两种方式是 Stream Load 和 Broker Load 。用户数据会被划分为实时数据和离线数据，用户的实时和离线数据一般首先会写入到 Talos 中（ Talos 是小米自研的分布式、高吞吐的消息队列）。来自 Talos 的离线数据会被 Sink 到 HDFS ，然后通过数据工场导入到 Doris ，用户可以在数据工场直接提交 Broker Load 任务将 HDFS 上的大批量数据导入到 Doris ，也可以在数据工场执行 SparkSQL 从 Hive 中进行数据查询，并将 SparkSQL 查到的数据通过 Spark-Doris-Connector 导入到 Doris，Spark-Doris-Connector 底层对 Stream Load 进行了封装。来自 Talos 的实时数据一般会通过两种方式导入到 Doris，一种是先经过 Flink 对数据进行 ETL ，然后每隔一定的时间间隔将小批量的数据通过 Flink-Doris-Connector 导入到 Doris，Flink-Doris-Connector 底层对 Stream Load 进行了封装；实时数据的另一种导入方式是，每隔一定的时间间隔通过 Spark Streaming 封装的 Stream Load 将小批量的数据导入到 Doris 。

## 03  数据查询

小米的 Doris 用户一般通过数鲸平台对 Doris 进行分析查询和结果展示。数鲸是小米自研的通用 BI 分析工具，用户可以通过数鲸平台对 Doris 进行查询可视化，并实现用户行为分析（为满足业务的事件分析、留存分析、漏斗分析、路径分析等行为分析需求，我们为 Doris 添加了相应的 UDF 和 UDAF ）和用户画像分析。 

## 04  Compaction 调优

对 Doris 来说，每一次数据导入都会在存储层的相关数据分片（Tablet）下生成一个数据版本，Compaction 机制会异步地对导入生成的较小的数据版本进行合并（Compaction 机制的详细原理可以参考之前的文章《 Doris Compaction 机制解析 》）。小米有较多高频、高并发、近实时导入的业务场景，在较短的时间内就会生成大量的小版本，Compaction 对数据版本合并不及时的话，就会造成版本累积，一方面过多的小版本会增加元数据的压力，另一方面版本数太多会影响查询性能。小米的使用场景中，有较多的表采用了 Unique 和 Aggregate 数据模型，查询性能严重依赖于 Compaction 对数据版本合并是否及时，在我们的业务场景中曾经出现过因为版本合并不及时导致查询性能降低数十倍，进而影响线上服务的情况。但是，Compaction 任务本身又比较耗费机器的 CPU 、内存和磁盘 IO 资源，Compaction 放得太开会占用过多的机器资源，也会影响到查询性能，还可能会造成 OOM。

针对 Compaction 存在的这一问题，我们一方面从业务侧着手，通过以下方面引导用户：

- 对表设置合理的分区和分桶，避免生成过多的数据分片。

- 规范用户的数据导入操作，尽量降低数据导入频率，增大单次导入的数据量，降低 Compaction 的压力。

- 避免过多地使用 Delete 操作。Delete 操作会在存储层的相关数据分片下生成一个 Delete 版本，Cumulative Compaction 任务在遇到 Delete 版本时会被截断，该次任务只能合并 Cumulative Point 之后到 Delete 版本之前的数据版本，并将 Cumulative Point 移动到 Delete 版本之后，把 Delete 版本交给后续的 Base Compaction 任务来处理。如果过多地使用 Delete 操作，在 Tablet 下会生成太多的 Delete 版本，进而导致 Cumulative Compaction 任务对版本合并的进度缓慢。使用 Delete 操作并没有真正从磁盘上删除数据，而是在 Delete 版本中记录了删除条件，数据查询时会通过 Merge-On-Read 的方式过滤掉被删除的数据，只有 Delete 版本被 Base Compaction 任务合并之后，Delete 操作要删除的数据才能作为过期数据随着 Stale Rowset 从磁盘上被清除。如果需要删除整个分区的数据，可以使用 Truncate 分区操作，而避免使用 Delete 操作。

另一方面，我们从运维侧对 Compaction 进行了调优：

- 根据业务场景的不同，针对不同集群配置了不同的 Compaction 参数（ Compaction 策略、线程数等）。

- 适当地降低了 Base Compaction 任务的优先级，增加了Cumulative Compaction 任务的优先级，因为 Base Compaction 任务执行时间长，有严重的写放大问题，而 Cumulative Compaction 任务执行比较快，并且能快速合并大量的小版本。

- 版本积压报警，动态调整 Compaction 参数。Compaction Producer 生产 Compaction 任务时，会更新相应的 Metric ，其中记录了 BE 节点上最大的 Compaction Score 的值，可以通过 Grafana 查看该指标的趋势判断是否出现了版本积压，另外，我们还增加了版本积压的报警。为方便 Compaction 参数调整，我们从代码层面进行了优化，支持运行时动态调整 Compaction 策略和  Compaction  线程数，避免调整 Compaction 参数的时候需要重启进程。

- 支持手动触发指定 Table 、指定 Partition 下数据分片的 Compaction 任务，提高指定 Table、指定 Partition 下数据分片的 Compaction 优先级。

# 监控和报警管理

## 01  监控系统 

Prometheus 会定时从 Doris 的 FE 和 BE 上拉取 Metrics 指标，并展示在 Grafana 监控面板中。基于轻舟数仓的服务元数据（轻舟数仓是轻舟平台基于小米全量大数据服务基础运行数据建设的数据仓库，由 2 张基表和 30+ 张维度表组成，覆盖了大数据组件运行时的资源、服务器 CMDB、成本、进程状态等全流程数据）会自动注册到 Zookeeper 中，Prometheus 会定时从 Zookeeper 中拉取最新的集群元数据信息，并在 Grafana 监控面板中动态展示。另外，我们在 Grafana 中还添加了针对 Doris 大查询列表、实时写入数据量、数据导入事务数等常见排障数据的统计和展示看板，能够联动报警让 Doris 运维同学在集群异常时以最短的时间定位集群的故障原因。

## 02  Falcon 

Falcon 是小米内部广泛使用的监控和报警系统，因为 Doris 原生地提供了较为完善的 Metrics 接口，可以基于 Prometheus 和 Grafana 方便地提供监控功能，所以我们在 Doris 服务中只使用了 Falcon 的报警功能。 针对 Doris 出现的不同级别故障，我们将报警定义为 P0、P1 和 P2 三个等级：

- P2 报警(报警等级为低)：单节点故障报警。单节点指标或进程状态发生异常一般作为 P2 等级发出报警，报警信息以小米办公（小米办公是字节跳动飞书在小米的私有化部署产品，功能和飞书类似）消息的形式发送到告警组成员。

- P1 报警(报警等级为较高)：集群短时间（3 分钟以内）内查询延迟升高或写入异常等短暂异常状况将作为 P1 等级发出报警，报警信息以小米办公消息的形式发送到告警组成员，P1等级报警要求 Oncall 工程师进行响应和反馈。

- P0 报警(报警等级为高)：集群长时间（3 分钟以上）查询延迟升高或写入异常等情况将作为 P0 等级发出报警，报警信息以小米办公消息+电话报警的形式发送，P0 级别报警要求 Oncall 工程师 1 分钟内进行响应并协调资源进行故障恢复和复盘准备。

以上对报警类型和案例进行了简单举例，实际上为了维护 Doris 系统稳定，我们还会有形式多样、级别各异的报警和巡检。 

## 03  Cloud-Doris 

Cloud-Doris 是小米针对内部 Doris 服务开发的数据收集组件，其最主要的能力在于对 Doris 服务的可用性进行探测以及对内部关注的集群指标数据进行采集。 举例说明：Cloud-Doris 定时会模拟用户对 Doris 系统进行读写来探测服务的可用性，如果集群出现可用性异常，则会通过 Falcon 进行报警；对用户的读写数据进行收集，进而生成用户账单；对表级别数据量、不健康副本、过大 Tablet 等信息进行收集，将异常信息通过 Falcon 进行报警。 

## 04  轻舟巡检 

对于容量、用户增长、资源配比等慢性隐患，我们使用统一的轻舟大数据服务巡检平台进行巡检和报告。巡检中一般包括两部分：服务特异性巡检和基础指标巡检，其中服务特异性巡检指各个大数据服务特有的不能通用的指标，对 Doris 来说，主要包括：Quota、分片副本数、单表列数、表分区数等；基础指标巡检主要指各服务间可以通用的巡检指标，主要包括：守护进程状态、进程状态、CPU/MEM/DISK、服务器故障及过保提示、资源利用率等。 通过增加巡检的方式，很好地覆盖了难以提前进行报警的慢性隐患，对重大节日无故障提供了支撑。

# 故障恢复

当线上集群发生故障时，应当以迅速恢复服务为第一原则。如果清楚故障发生的原因，则根据具体的原因进行处理并恢复服务，如果不清楚故障原因，则保留现场后第一时间应该尝试重启进程，以恢复服务。

## 01  接入故障处理

Doris 使用小米 LVS 作为接入层，与开源或公有云的 LB 服务类似，提供 4 层或 7 层的流量负载调度能力。用户通过 VIP (域名)连接 Doris 集群。Doris 绑定合理的探活端口后，一般来说，如果 FE 单节点发生异常会自动被踢除，能够在用户无感知情况下恢复服务，同时会针对异常节点发出报警。当然，对于预估短时间内无法处理完成的 FE 故障，我们会先调整故障节点的权重为 0 或者先从 LVS 删除异常节点，防止进程探活异常引发不可预估的问题。

## 02  节点故障处理 

对于 FE 节点故障，如果无法快速定位故障原因，一般需要保留线程快照和内存快照后重启进程。可以通过如下命令保存 FE 的线程快照：

```undefined
jstack 进程ID >> 快照文件名.jstack
```

通过以下命令保存 FE 的内存快照：

```undefined
jmap -dump:live,format=b,file=快照文件名.heap 进程ID
```

在版本升级或一些意外场景下，FE 节点的 image 可能出现元数据异常，并且可能出现异常的元数据被同步到其它 FE 的情况，导致所有 FE 不可工作。一旦发现 image 出现故障，最快的恢复方案是使用 Recovery 模式停止 FE 选举，并使用备份的 image 替换故障的 image。当然，时刻备份 image 并不是容易的事情，鉴于该故障常见于集群升级，我们建议在集群升级的程序中，增加简单的本地 image 备份逻辑，保证每次升级拉起 FE 进程前会保留一份当前最新的 image 数据。 对于 BE 节点故障，如果是进程崩溃，会产生 Core 文件，且 Minos 会自动拉取进程；如果是任务卡住，则需要通过以下命令保留线程快照后重启进程：

```undefined
pstack 进程ID >> 快照文件名.pstack
```

# 结束语

自从 2019 年 9 月小米集团首次引入 Apache Doris 以来，在两年多的时间里， Apache Doris 已经在小米内部得到了广泛的 使用，目前已经服务了小米数十个业务、集群数量达几十个、节点规模达到数百个，并且已经在小米内部形成了一套以 Apache Doris 为核心的数据生态。 为了提高运维效率，小米内部也围绕 Doris 研发了一整套的自动化管理和运维系统。 随着服务的业务越来越多，当然 Doris 也暴露出了一些问题，比如在过去版本没有比较好的资源隔离机制、业务之间会相互影响，另外系统监控还有待继续完善。 随着社区的快速发展，越来越多的小伙伴参与到了社区建设，向量化引擎已经改造完成，查询优化器的改造工作正在如火如荼地进行，Apache Doris 正在逐渐走向成熟。