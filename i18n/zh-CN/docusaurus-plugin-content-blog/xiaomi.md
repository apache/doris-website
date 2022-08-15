---
{
    'title': 'Apache Doris 在小米数据场景的应用实践与优化',
    'summary': "因增长分析业务需要，小米集团于 2019 年首次引入了 Apache Doris 。经过三年时间的发展，目前 Apache Doris 已经在广告投放、新零售、增长分析、数据看板、天星数科、小米有品、用户画像等小米内部数十个业务中得到广泛应用 ，并且在小米内部已经形成一套以 Apache Doris 为核心的数据生态。",
    'date': '2022-08-15',
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

因增长分析业务需要，小米集团于 2019 年首次引入了 Apache Doris 。经过三年时间的发展，目前 Apache Doris 已经在广告投放、新零售、增长分析、数据看板、天星数科、小米有品、用户画像等小米内部数十个业务中得到广泛应用 **，并且在小米内部已经形成一套以 Apache Doris 为核心的数据生态。**
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/25d7c2c45acd4e1c8c1a1742016fc6b9~tplv-k3u1fbpfcp-zoom-1.image)
当前 Apache Doris 在小米内部已经具有**数十个**集群、总体达到**数百台** BE 节点的规模，其中单集群最大规模达到**近百台节点**，拥有**数十个**流式数据导入产品线，每日单表最大增量 **120 亿**、支持 **PB 级别**存储，单集群每天可以支持 **2W 次以上**的多维分析查询。
# 架构演进

小米引入 Apache Doris 的初衷是为了解决内部进行用户行为分析时所遇到的问题。随着小米互联网业务的发展，各个产品线利用用户行为数据对业务进行增长分析的需求越来越迫切。让每个业务产品线都自己搭建一套增长分析系统，不仅成本高昂，也会导致效率低下。因此能有一款产品能够帮助他们屏蔽底层复杂的技术细节，让相关业务人员能够专注于自己的技术领域，可以极大提高工作效率。基于此，小米大数据和云平台联合开发了增长分析系统 Growing Analytics（下文中简称 GA )，旨在提供一个灵活的多维实时查询和分析平台，统一数据接入和查询方案，帮助业务线做精细化运营。（此处内容引用自：[基于Apache Doris的小米增长分析平台实践](https://mp.weixin.qq.com/s?__biz=MzUxMDQxMDMyNg==&mid=2247486817&idx=1&sn=99fbef15b4d6f6059c3affbc77517e6e&scene=21#wechat_redirect)）

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/897a0453e1a540ae88cdf05ee9188b56~tplv-k3u1fbpfcp-zoom-1.image)

分析、决策、执行是一个循环迭代的过程，在对用户进行行为分析后，针对营销策略是否还有提升空间、是否需要在前端对用户进行个性化推送等问题进行决策，帮助小米实现业务的持续增长。这个过程是对用户行为进行**分析-决策-优化执行-再分析-再决策-再优化执行**的迭代过程。


### 历史架构

增长分析平台立项于 2018 年年中，当时基于开发时间和成本，技术栈等因素的考虑，小米复用了现有各种大数据基础组件（HDFS, Kudu, SparkSQL 等），搭建了一套基于 Lamda 架构的增长分析查询系统。**GA 系统初代版本的架构如下图所示，包含了以下几个方面：**

-   数据源：数据源是前端的埋点数据以及可能获取到的用户行为数据。
-   数据接入层：对埋点数据进行统一的清洗后打到小米内部自研的消息队列 Talos 中，并通过 Spark Streaming 将数据导入存储层 Kudu 中。
-   存储层：在存储层中进行冷热数据分离。热数据存放在 Kudu 中，冷数据则会存放在 HDFS 上。同时在存储层中进行分区，当分区单位为天时，每晚会将一部分数据转冷并存储到 HDFS 上。
-   计算层/查询层：在查询层中，使用 SparkSQL 对 Kudu 与 HDFS 上数据进行联合视图查询，最终把查询结果在前端页面上进行显示。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9039c4f9ef8a4a3cbfd092b21233e831~tplv-k3u1fbpfcp-zoom-1.image)

**在当时的历史背景下，初代版本的增长分析平台帮助我们解决了一系列用户运营过程中的问题，但同时在历史架构中也存在了两个问题：**

**第一个问题：** 由于历史架构是基于 SparkSQL + Kudu + HDFS 的组合，依赖的组件过多导致运维成本较高。原本的设计是各个组件都使用公共集群的资源，但是实践过程中发现执行查询作业的过程中，查询性能容易受到公共集群其他作业的影响，容易抖动，尤其在读取 HDFS 公共集群的数据时，有时较为缓慢。

**第二个问题：** 通过 SparkSQL 进行查询时，延迟相对较高。SparkSQL 是基于批处理系统设计的查询引擎，在每个 Stage 之间交换数据 Shuffle 的过程中依然需要落盘操作，完成 SQL 查询的时延较高。为了保证 SQL 查询不受资源的影响，我们通过添加机器来保证查询性能，但是实践过程中发现，性能提升的空间有限，这套解决方案并不能充分地利用机器资源来达到高效查询的目的，存在一定的资源浪费。 **（此处内容引用自：[基于Apache Doris的小米增长分析平台实践](https://mp.weixin.qq.com/s?__biz=MzUxMDQxMDMyNg==&mid=2247486817&idx=1&sn=99fbef15b4d6f6059c3affbc77517e6e&scene=21#wechat_redirect)）**

针对上述两个问题，我们的目标是寻求一款计算存储一体的 MPP 数据库来替代我们目前的存储计算层的组件，**在通过技术选型后，最终我们决定使用 Apache Doris 替换老一代历史架构。**

### 基于 Apache Doris 的新版架构

当前架构从数据源获取前端埋点数据后，通过数据接入层打入 Apache Doris 后可以直接查询结果并在前端进行显示。![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/540f5fa779af4b629869e54b793ea273~tplv-k3u1fbpfcp-zoom-1.image)

**选择 Doris 原因：**

-   Doris 具有优秀的查询性能，能够满足业务需求。

-   Doris 支持标准 SQL ，用户使用与学习成本较低。

-   Doris 不依赖于其他的外部系统，运维简单。

-   Doris 社区拥有很高活跃度，有利于后续系统的维护升级。

### 新旧架构性能对比

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ada8246b409a4cb6b11ffd2454aa2b06~tplv-k3u1fbpfcp-zoom-1.image)

我们选取了日均数据量大约 10 亿的业务，分别在不同场景下进行了性能测试，其中包含 6 个事件分析场景，3 个留存分析场景以及 3 个漏斗分析场景。**经过对比后，得出以下结论：**

-   在事件分析的场景下，平均查询所耗时间**降低了 85%** 。
-   在留存分析和漏斗分析场景下，平均查询所耗时间**降低了 50%** **。**


# 应用实践

随着接入业务的增多和数据规模的增长，让我们也遇到不少问题和挑战，下面我们将介绍在**使用 Apache Doris 过程中沉淀出来的一些实践经验**。

### 数据导入

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8afce198933f4ca4b2c97d4cf85b27de~tplv-k3u1fbpfcp-zoom-1.image)小米内部主要通过 Stream Load 与 Broker Load 以及少量 Insert 方式来进行 Doris 的数据导入。数据一般会先打到 Talos 消息队列中，并分为实时数据和离线数据两个部分。

**实时数据写入 Apache Doris 中：**

 一部分业务在通过 Flink 对数据进行处理后，会通过 Doris 社区提供的 Flink Doris Connector 组件写入到 Doris 中，底层依赖于 Doris Stream Load 数据导入方式。也有一部分会通过 Spark Streaming 封装的 Stream Load 将数据导入到 Doris 中。

**离线数据写入** **Apache Doris 中：**

离线数据部分则会先写到 Hive 中，再通过小米的数据工场将数据导入到 Doris 中。用户可以直接在数据工场提交 Broker Load 任务并将数据直接导入 Doris 中，也可以通过 Spark SQL 将数据导入 Doris 中。Spark SQL 方式则是依赖了 Doris 社区提供的 Spark Doris Connector 组件，底层也是对 Doris 的 Stream Load 数据导入方式进行的封装。

### 数据查询

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8c1cd3554e854dbe99aba27499e28118~tplv-k3u1fbpfcp-zoom-1.image)

用户通过数据工场将数据导入至 Doris 后即可进行查询，在小米内部是通过小米自研的数鲸平台来做查询的。用户可以通过数鲸平台对 Doris 进行查询可视化，并实现用户行为分析（为满足业务的事件分析、留存分析、漏斗分析、路径分析等行为分析需求，我们为 Doris 添加了相应的 UDF 和 UDAF ）和用户画像分析。

虽然目前依然需要将 Hive 的数据导过来，但 Doris 社区也正在支持湖仓一体能力，在后续实现湖仓一体能力后，我们会考虑直接通过 Doris 查询 Hive 与 Iceberg 外表。**值得一提的是，Doris 1.1 版本已经实现支持查询 Iceberg 外表能力。** 同时在即将发布的 **1.2 版本**中，还将支持 Hudi 外表并增加了 Multi Catalog ，可以实现外部表元数据的同步，无论是查询外部表的性能还是接入外表的易用性都有了很大的提升。

### Compaction 调优

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/92ad4ea90c564af2b720080b449c6edf~tplv-k3u1fbpfcp-zoom-1.image)

Doris 底层采用类似 LSM-Tree 方式，支持快速的数据写入。每一次的数据导入都会在底层的 Tablet 下生成一个新的数据版本，每个数据版本内都是一个个小的数据文件。单个文件内部是有序的，但是不同的文件之间又是无序的。为了使数据有序，在 Doris 底层就会存在 Compaction 机制，异步将底层小的数据版本合并成大的文件。Compaction 不及时就会造成版本累积，增加元数据的压力，并影响查询性能。由于 Compaction 任务本身又比较耗费机器CPU、内存与磁盘资源，如果 Compaction 开得太大就会占用过多的机器资源并影响到查询性能，同时也可能会造成 OOM。**针对以上问题，我们一方面从业务侧着手，通过以下方面引导用户：**

-   通过引导业务侧进行合理优化，对表设置**合理的分区和分桶**，避免生成过多的数据分片。
-   引导用户尽量**降低数据的导入频率** **，** **增大单次数据导入的量**，降低 Compaction 压力。
-   引导用户**避免过多使用会在底层生成 Delete 版本的 Delete 操作**。在 Doris 中 Compaction 分为 Base Compaction 与 Cumulative Compaction。Cumulative Compaction 会快速的把大量新导入的小版本进行快速的合并，在执行过程中若遇到 Delete 操作就会终止并将当前 Delete 操作版本之前的所有版本进行合并。由于 Cumulative Compaction 无法处理 Delete 版本，在合并完之后的版本会和当前版本一起放到 Base Compaction 中进行。当 Delete 版本特别多时， Cumulative Compaction 的步长也会相应变短，只能合并少量的文件，导致 Cumulative Compaction 不能很好的发挥小文件合并效果。

**另一方面我们从运维侧着手：**

-   **针对不同的业务集群配置不同的 Compaction 参数。** 部分业务是实时写入数据的，需要的查询次数很多，我们就会将 Compaction 开的大一点以达到快速合并目的。而另外一部分业务只写今天的分区，但是只对之前的分区进行查询，在这种情况下，我们会适当的将 Compaction 放的小一点，避免 Compaction 占用过大内存或 CPU 资源。到晚上导入量变少时，之前导入的小版本能够被及时合并，对第二天查询效率不会有很大影响。
-   **适当降低 Base Compaction 任务优先级并增加 Cumulative Compaction 优先级。** 根据上文提到的内容，Cumulative Compaction 能够快速合并大量生成的小文件，而 Base Compaction 由于合并的文件较大，执行的时间也会相应变长，读写放大也会比较严重。所以我们希望 Cumulative Compaction 优先、快速的进行。
-   **增加版本积压报警。** 当我们收到版本积压报警时，动态调大 Compaction 参数，尽快消耗积压版本。
-   **支持手动触发指定表与分区下数据分片的 Compaction 任务。** 由于 Compaction 不及时，部分表在查询时版本累积较多并需要能够快速进行合并。所以，我们支持对单个表或单个表下的某个分区提高 Compaction 优先级。

**目前 Doris 社区针对以上问题已经做了** **一系列的优化** **，在 1.1 版本中** **大幅增强了数据 Compaction 能力，对于新增数据能够快速完成聚合，避免分片数据中的版本过多导致的 -235 错误以及带来的查询效率问题。**\
**首先**，在 Doris 1.1 版本中，引入了 QuickCompaction，增加了主动触发式的 Compaction 检查，在数据版本增加的时候主动触发 Compaction。同时通过提升分片元信息扫描的能力，快速的发现数据版本多的分片，触发 Compaction。通过主动式触发加被动式扫描的方式，彻底解决数据合并的实时性问题。

**同时**，针对高频的小文件 Cumulative Compaction，实现了 Compaction 任务的调度隔离，防止重量级的 Base Compaction 对新增数据的合并造成影响。

**最后**，针对小文件合并，优化了小文件合并的策略，采用梯度合并的方式，每次参与合并的文件都属于同一个数据量级，防止大小差别很大的版本进行合并，逐渐有层次的合并，减少单个文件参与合并的次数，能够大幅的节省系统的 CPU 消耗。![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cd2f0a547d6e4ddcb027715c4a544c5a~tplv-k3u1fbpfcp-zoom-1.image)**在社区 1.1 新版本的测试结果中，不论是Compaction 的效率、CPU 的资源消耗，还是高频导入时的查询抖动，效果都有了大幅的提升。**

**具体可以参考：** [Apache Doris 1.1 特性揭秘：Flink 实时写入如何兼顾高吞吐和低延时](http://mp.weixin.qq.com/s?__biz=Mzg3Njc2NDAwOA==&mid=2247500848&idx=1&sn=a667665ed4ccf4cf807a47be7c264f69&chksm=cf2fca37f85843219e2f74d856478d4aa24d381c1d6e7f9f6a64b65f3344ce8451ad91c5af97&scene=21#wechat_redirect)

### 监控报警

Doris 的监控主要是通过 Prometheus 以及 Grafana 进行。对于 Doris 的报警则是通过 Falcon 进行。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3fbe6b44f1124a91bf5ee17608f302d5~tplv-k3u1fbpfcp-zoom-1.image)小米内部使用 Minos 进行集群部署。Minos 是小米内部自研并开源的大数据服务进程管理工具。在完成 Doris 集群部署后会更新至小米内部的轻舟数仓中。在轻舟数仓中的节点注册到 ZooKeeper 后，Prometheus 会监听 ZooKeeper 注册的节点，同时访问对应端口，拉取对应 Metrics 。在这之后，Grafana 会在面板上对监控信息进行显示，若有指标超过预设的报警阈值，Falcon 报警系统就会在报警群内报警，同时针对报警级别较高或某些无法及时响应的警告，可直接通过电话呼叫值班同学进行报警。


另外，小米内部针对每一个 Doris 集群都有 Cloud - Doris 的守护进程。Could - Doris 最大功能是可以对 Doris 进行可用性探测。比如我们每一分钟对 Doris 发送一次 select current timestamp(); 查询，若本次查询 20 秒没有返回，我们就会判断本次探测不可用。小米内部对每一个集群的可用性进行保证，通过上述探测方法，可以在小米内部输出 Doris可用性指标。


# 小米对Apache Doris的优化实践

在应用 Apache Doris 解决业务问题的同时，我们也发现了 Apache Doris 存在的一些优化项，因此在与社区进行沟通后我们开始深度参与社区开发，解决自身问题的同时也及时将开发的重要 Feature 回馈给社区，具体包括 Stream Load 两阶段提交（2PC）、单副本数据导入、Compaction 内存限制等。

### Stream Load 两阶段提交（2PC)

**遇到的问题**

在 Flink 和 Spark 导入数据进 Doris 的过程中，当某些异常状况发生时可能会导致如下问题：

**Flink 数据重复导入** **：** Flink 通过周期性 Checkpoint 机制处理容错并实现 EOS，通过主键或者两阶段提交实现包含外部存储的端到端 EOS。Doris-Flink-Connector 1.1 之前 UNIQUE KEY 表通过唯一键实现了EOS，非 UNIQUE KEY 表不支持 EOS。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e7750384cac44a569c8edf6c5de61744~tplv-k3u1fbpfcp-zoom-1.image)

 **Spark SQL 数据部分导入** **：** 通过 SparkSQL 从 Hive 表中查出的数据并写入 Doris 表中的过程需要使用到 Spark Doris Connector 组件，会将 Hive 中查询的数据通过多个 Stream Load 任务写入 Doris 中，出现异常时会导致部分数据导入成功，部分导入失败。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/936ffd500f364f838a9976584727ed42~tplv-k3u1fbpfcp-zoom-1.image)

**Stream Load 两阶段提交设计**

以上两个问题可以通过导入支持两阶段提交解决，第一阶段完成后确保数据不丢且数据不可见，这就能保证第二阶段发起提交时一定能成功，也能够保证第二阶段发起取消时一定能成功。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/50e59f3a78f74ba6a8dd2d7960497adb~tplv-k3u1fbpfcp-zoom-1.image)

**Doris 中的写入事务分为三步：**

1.  在  FE 上开始事务，状态为 Prepare ；
1.  数据写入 BE；
1.  多数副本写入成功的情况下，提交事务，状态变成 Committed，并且 FE 向 BE 下发 Publish Version 任务，让数据立即可见。

引入两阶段提交之后，第 3 步变为状态修改为 Pre Commit，Publish Version 在第二阶段完成。用户在第一阶段完成后（事务状态为 Pre Commit ），可以选择在第二阶段放弃或者提交事务。

**支持 Flink Exactly-Once 语义**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ef5e0a81b441487ba7c3b3fa22e8c85d~tplv-k3u1fbpfcp-zoom-1.image)Doris-Flink-Connector 1.1 使用两阶段 Stream Load 并支持 Flink 两阶段提交实现了 EOS，只有全局的 Checkpoint 完成时，才会发起 Sream Load 的第二阶段提交，否则发起第二阶段放弃。

**解决 SparkSQL 数据部分导入**

Doris-Spark-Connector 使用两阶段 Stream Load 之后，成功的 Task 通过 Stream Load 第一阶段将写入数据到 Doris （Pre Commit 状态，不可见），当作业成功后，发起所有 Stream Load 第二阶段提交，作业失败时，发起所有 Stream Load 第二阶段取消。这就确保了不会有数据部分导入的问题。![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/26b11a29566946c99b53ef90e01665ef~tplv-k3u1fbpfcp-zoom-1.image)

### 单副本数据导入优化

**单副本数据导入设计**

**Doris 通过多副本机制确保数据的高可靠以及系统高可用。** 写入任务可以按照使用的资源分为计算和存储两类：排序、聚合、编码、压缩等使用的是 CPU 和内存的计算资源，最后的文件存储使用存储资源，三副本写入时计算和存储资源会占用三份。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a0012b34b7404e5482700c281f6c206f~tplv-k3u1fbpfcp-zoom-1.image)

那能否只写一份副本数据在内存中，待到单副本写入完成并生成存储文件后，将文件同步到另外两份副本呢？答案是可行的，因此针对三副本写入的场景，我们做了单副本写入设计。**单副本数据在内存中做完排序、聚合、编码以及压缩后，将文件同步至其他两个副本，这样很大程度上可以节省出 CPU 和内存资源。**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e3528e0d75184068aa3b50384cb548d1~tplv-k3u1fbpfcp-zoom-1.image)

**性能对比测试**

**Broker Load 导入 62G 数据性能对比**
**导入时间：** 三副本导入耗时 33 分钟，单副本导入耗时 31 分钟。

**内存使用：** 内存使用上优化效果十分明显，三副本数据导入的内存使用是单副本导入的三倍。单副本导入时只需要写一份内存，但是三副本导入时需要写三份内存，内存优化达到了 3 倍。

**CPU 消耗对比：** 三副本导入的 CPU 消耗差不多是单副本的三倍。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cbe6bb648e8d47d09c556eed4ffcdfa9~tplv-k3u1fbpfcp-zoom-1.image)

**并发场景性能对比**

测试中向  100 个表并发导入数据，每个表有 50 个导入任务，任务总数为 5000 个。单个 Stream Load 任务导入的数据行是 200 万行，约为 90M 的数据。测试中开了 128 个并发，**将** **单副本导入和三副本导入进行了对比：**

**导入时间：** 3 副本导入耗时 67 分钟，而后单副本耗时 27 分钟完成。导入效率相当提升两倍以上。

**内存使用：** 单副本的导入会更低。

**CPU消耗对比：** 由于都已经是开了并发在导入，CPU开销都比较高，但是单副本导入吞吐提升明显。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5a4f5533c4184f8caab39c38d951e410~tplv-k3u1fbpfcp-zoom-1.image)

**Compaction 内存限制**

之前 Doris 在单机磁盘一次导入超过 2000 个 Segment 的情况下，Compaction 有内存 OOM 的问题。对于当天写入但不查当天数据而是查询之前的数据业务场景，我们会把 Compaction 稍微放的小一点，避免占用太大的内存，导致进程 OOM。Doris 之前每个磁盘有固定的线程做存储在这个盘上的数据的 Compaction，没有办法在全局进行管控。因为我们要限制单个节点上面内存的使用，**所以我们将该模式改成了生产者-消费者模式：**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ede14473f9104bdc89213e82398ba32a~tplv-k3u1fbpfcp-zoom-1.image)

生产者不停的从所有的磁盘上面生产任务，之后将生产任务提交到线程池中。我们可以很好的把控线程池的入口，达到对 Compaction 的限制。我们在合并时会把底层的小文件进行归并排序，之后在内存里给每一个文件开辟 Block，所以我们可以近似认为占用的内存量与文件的数量是相关的，从而可以通过对单节点上同时执行合并的文件数量做限制，来达到控制内存的效果。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/00803f23d5a0427fb57abde4a2b1ec2d~tplv-k3u1fbpfcp-zoom-1.image)

**我们增加了对单个 BE Compaction 合并的文件数量的限制。** 若正在进行的 Compaction 的文件数量超过或等于当前限制时，后续提交上来的任务就需要等待，等到前面的 Compaction 任务做完并将指标释放出来后，后边提交进来的那些任务才可以进行。

通过这种方式，我们对某些业务场景做了内存的限制，很好的避免集群负载高时占用过多内存导致 OOM 的问题。

# 总结

自从 Apache Doris 从 2019 年上线第一个业务至今，**目前 Apache Doris 已经在小米内部服务了数十个业务、集群数量达到数十个、节点规模达到数百台、每天完成数万次用户在线分析查询，承担了包括增长分析和报表查询等场景绝大多数在线分析的需求。**

与此同时，以上所列小米对于 Apache Doris 的优化实践，已经有部分功能已经在 Apache Doris 1.0 或 1.1 版本中发布，有部分 PR 已经合入社区 Master，在不久后发布的 1.2 新版本中应该就会与大家见面。随着社区的快速发展，有越来越多小伙伴参与到社区建设中，社区活跃度有了极大的提升。Apache Doris 已经变得越来越成熟，并开始从单一计算存储一体的分析型 MPP 数据库走向湖仓一体的道路，相信在未来还有更多的数据分析场景等待去探索和实现。
