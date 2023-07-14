---
{
    'title': '秒级数据写入，毫秒查询响应，天眼查基于 Apache Doris 构建统一实时数仓',
    'summary': "天眼查引入 Apache Doris 对数仓架构进行升级改造，实现了数据门户的统一，大大缩短了数据处理链路，数据导入速率提升 75 %，500 万及以下人群圈选可以实现毫秒级响应，收获了公司内部数据部门、业务方的一致好评",
    'date': '2023-07-01',
    'author': '王涛',
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

**导读：** 随着天眼查近年来对产品的持续深耕和迭代，用户数量也在不断攀升，业务的突破更加依赖于数据赋能，精细化的用户/客户运营也成为提升体验、促进消费的重要动力。在这样的背景下正式引入 Apache Doris 对数仓架构进行升级改造，实现了数据门户的统一，大大缩短了数据处理链路，数据导入速率提升 75 %，500 万及以下人群圈选可以实现毫秒级响应，收获了公司内部数据部门、业务方的一致好评。

**作者：** 王涛，天眼查实时计算负责人

# 业务需求

天眼查的数据仓库主要服务于三个业务场景，每个场景都有其特点和需求，具体如下：

1.  **亿级用户人群圈选：** 人群圈选场景中目前有 100+ 人群包，我们需要根据 SQL 条件圈选人群包，来支持人群包的交并差、人群包实时圈选和人群包更新通知下游等需求。例如：圈选出下单未支付超过 5 分钟的用户，我们通过用户标签可以直观掌握用户支付状态，为运营 & 营销团队提供更精细化的人群管理服务，从而提高转化率。
1.  **多元活动支撑的精准营销：** 该场景目前支持了 1000 多个指标，可支持即席查询，根据活动效果及时调整运营策略。例如在“开工季”活动中，需要为数据分析 & 运营团队提供数据支持，从而生成可视化的活动驾驶舱。
1.  **高并发的 C 端分析数据：** 该场景承载了 3 亿+实体（多种维度）的数据体量，同时要求实时更新，以供用户进行数据分析。

# 原有架构及痛点

为满足各业务场景提出的需求，我们开始搭建第一代数据仓库，即原有数仓：

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3d532df25bc948cb847107a149b9079f~tplv-k3u1fbpfcp-zoom-1.image)

在原有数仓架构中， Hive 作为数据计算层，MySQL、ES、PG 作为数据存储层，我们简单介绍一下架构的运行原理：

-   **数据源层和数据接入层：** MySQL 通过 Canal 将 BinLog 接入 Kafka、埋点日志通过 Flume 接入 Kafka，最后由 DataX 把 Kafka 中的数据接入数据计算层 Hive 中；
-   **数据计算层：** 该层使用 Hive 中的传统的数仓模型，并利用海豚调度使数据通过 ODS -> DWD -> DWS 分层，最后通过 DataX 将 T+1 把数据导入到数据存储层的 MySQL 和 ES 中。
-   **数据存储层：** MySQL 主要为 DataBank、Tableau、C 端提供分析数据，ES 用于存储用户画像数据，PG 用于人群包的存储（PG 安装的插件具有 Bitmap 交并差功能），ES、PG 两者均服务于 DMP人群圈选系统。

**问题与挑战：**

依托于原有架构的投入使用，初步解决了业务方的需求，但随着天眼查近年来对产品的持续深耕和迭代，用户数量也在不断攀升，业务的突破更加依赖于数据赋能。精细化的用户/客户运营也成为提升体验、促进消费的重要动力。在这样的背景下，原有架构的缺点逐渐暴露：

1.  开发流程冗长：体现在数据处理链路上，比如当面对一个简单的开发需求，需要先拉取数据，再经过 Hive 计算，然后通过 T+1更新导入数据等，数据处理链路较长且复杂，非常影响开发效率。
1.  不支持即席查询：体现在报表服务和人群圈选场景中，所用的指标无法根据条件直接查询，必须提前进行定义和开发。
1.  T+1 更新延迟高：T+1 数据时效性已经无法提供精确的线索，主要体现在报表和人群圈选场景上。
1.  运维难度高：原有架构具有多条数据处理链路、多组件耦合的特点，运维和管理难度都很高。

# 理想架构

基于以上问题，我们决定对架构进行升级改进，在正式升级之前，我们希望未来的架构可以做到以下几点：

-   原架构涉及 MySQL 、PG、ES 等多个组件，并为不同应用提供服务；我们希望未来的架构可以兼容 MySQL 协议，实现低成本替换、无缝衔接以上组件。
-   支持即席查询且性能优异，即席查询能够给业务方提供更灵活的表达方式，业务方可以从多个角度、多个维度对数据进行查询和分析，更好地发现数据的规律和趋势，帮助业务方更精准备地做出决策。
-   支持实时聚合，以减轻开发负担并保证计算结果的准确性。
-   统一数据出口，原架构中数据出口不唯一，我们希望未来的架构能更统一数据出口，缩短链路维护成本，提升数据的可复用性。
-   支持高并发， C 端的实时分析数据需要较高的并发能力，我们希望未来的架构可以高并发性能优异。

# 技术选型

考虑到和需求的匹配度，我们重点对 OLAP 引擎进行了调研，并快速定位到 ClickHouse 和 [Apache Doris](https://doris.apache.org/zh-CN/) 这两款产品，在深入调研中发现 Doris 在以下几个方面优势明显，更符合我们的诉求：

-   标准 SQL：ClickHouse 对标准 SQL 支持有限，使用中需要对多表 Join 语法进行改写；而 Doris 兼容 MySQL 协议，支持标准 SQL ，可以直接运行，同时 Doris 的 Join 性能远优于 ClickHouse。
-   降本增效：Doris 部署简单，只有 FE 和 BE 两个组件，不依赖其他系统；生态内导数功能较为完备，可针对数据源/数据格式选择导入方式；还可以直接使用命令行操作弹性伸缩，无需额外投入人力；运维简单，问题排查难度低。相比之下，ClickHouse 需要投入较多的开发人力来实现类似的功能，使用难度高；同时 ClickHouse 运维难度很高，需要研发一个运维系统来支持处理大部分的日常运维工作。
-   并发能力：ClickHouse 的并发能力较弱是一个潜在风险，而 Doris 并发能力更占优势，并且刚刚发布的 2.0 版本支持了[更高并发的点查](https://mp.weixin.qq.com/s?__biz=Mzg3Njc2NDAwOA==&mid=2247516978&idx=1&sn=eb3f1f74eedd2306ca0180b8076fe773&chksm=cf2f8d35f85804238fd680c18b7ab2bc4c53d62adfa271cb31811bd6139404cc8d2222b9d561&token=699376670&lang=zh_CN#rd)。
-   导入事务：ClickHouse 的数据导入没有事务支持，无法实现 Exactly Once 语义，如导数失败需要删除重导，流程比较复杂；而 Doris 导入数据支持事务，可以保证一批次内的数据原子生效，不会出现部分数据写入的情况，降低了判断的成本。
-   丰富的使用场景：ClickHouse 支持场景单一，Doris 支持场景更加丰富，用户基于 Doris 可以构建用户行为分析、AB 实验平台、日志检索分析、用户画像分析、订单分析等应用。
-   丰富的数据模型：Doris 提供了Unique、Duplicate、Aggregate 三种数据模型，可以针对不同场景灵活应用不同的数据模型。
-   社区响应速度快：Doris 社区的响应速度是其独有特色，SelectDB 为社区组建了一直完备的社区支持团队，社区的快速响应让我们少走了很多歪路，帮助我们解决了许多问题。

# 新数仓架构

经过对 Doris 进行综合评估，我们最终决定采用 Doris 对原有架构进行升级优化，并在架构层级进行了压缩。新的架构图如下所示：

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c053e0f2491c44c5a2ef253f7496f449~tplv-k3u1fbpfcp-zoom-1.image)

在新架构中，数据源层和数据接入层与原有架构保持一致，**主要变化是将 Doris 作为新架构的数据服务层，统一了原有架构中的数据计算层和存储层，这样实现了数据门户的统一，大大缩短了数据处理链路，解决了开发流程冗长的问题。** 同时，基于 Doris 的高性能，实现了即席查询能力，提高了数据查询效率。另外，Flink 与 Doris 的结合实现了实时数据快速写入，解决了 T+1 数据更新延迟较高的问题。除此之外，借助于 Doris 精简的架构，大幅降低了架构维护的难度。

**数据流图**

缩短数据处理链路直接或间接地带来了许多收益。接下来，我们将具体介绍引入 Doris 后的数据流图。

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/090c5467c81e43a0b68da227cab59dad~tplv-k3u1fbpfcp-zoom-1.image)

总体而言，数据源由 MySQL 和日志文件组成，数据在 Kafka 中进行分层操作（ODS、DWD、DWS），Apache Doris 作为数据终点统一进行存储和计算。应用层包含 C 端、Tableau 和 DMP 系统，通过网关服务从 Doris 中获取相应的数据。

具体来看，MySQL 通过 Canal 把 Binlog 接入 Kafka，日志文件通过 Flume 接入 Kafka 作为 ODS 层。然后经过 Flink SQL 进行清洗、关联维表，形成 DWD 层的宽表，并生成聚合表。为了节省空间，我们将 ODS 层存储在 Kafka 中，DWD 层和 DWS 层主要与 Doris 进行交互。DWD 层的数据一般通过 Flink SQL 写入 Doris。针对不同的场景，我们应用了不同的数据模型进行数据导入。MySQL 数据使用 Unique 模型，日志数据使用 Duplicate 模型，DWS 层采用 Aggregate 模型，可进行实时聚合，从而减少开发成本。

# 应用场景优化

在应用新的架构之后，我们必须对业务场景的数据处理流程进行优化以匹配新架构，从而达到最佳应用效果。接下来我们以人群圈选、C端分析数据及精准营销线索为主要场景，分享相关场景流程优化的实践与经验。

## 人群圈选

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d7dd9fa07aa24b9f8368afa24efcd736~tplv-k3u1fbpfcp-zoom-1.image)

**原流程（左）中**，业务人员在画像平台页面上利用表的元数据创建人群圈选任务，任务创建后进行人群 ID 分配，写入到 PG 画像表和 MySQL 任务表中。接着根据任务条件定时在 ES 中查询结果，获取结果后更新任务表的状态，并把 Bitmap 人群包写入 PG。利用 PG 插件提供的 Bitmap 交并差能力操作人群包，最后下游运营介质从 PG 取相应人群包。

然而，该流程处理方式非常复杂，ES 和 PG 中的表无法复用，造成成本高、效益低。同时，原流程中的数据为 T+1 更新，标签必须提前进行定义及计算，这非常影响查询效率。

**现流程（右）中**，业务人员在画像平台创建人群圈选任务，后台分配人群 ID，并将其写入 MySQL 任务表中。首次圈选时，根据任务条件在 Doris 中进行即席查询，获取结果后对任务表状态进行更新，并将人群包写入 Doris。后续根据时间进行微批轮询，利用 Doris Bitmap 函数提供的交并差功能与上一次的人群包做差集，如果有人群包更新会主动通知下游。

引入 Doris 后，原有流程的问题得到了解决，新流程以 Doris 为核心构建了人群圈选服务，支持人群包实时更新，新标签无需提前定义，可通过条件配置自助生成，减少了开发时间。新流程表达方式更加灵活，为人群包 AB 实验提供了便捷的条件。流程中采用 Doris 统一了明细数据和人群包的存储介质，实现业务聚焦，无需处理多组件数据之间的读写问题，达到了降本增效的终极目标。

## C端分析数据及精准营销线索场景

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5d94e74cae5748f7944a61b4f6d85a53~tplv-k3u1fbpfcp-zoom-1.image)

**原流程：** 在原流程中，如果业务提出新需求，需要先发起需求变更，再经过评审、排期开发，然后开始对 Hive 中的数据模型进行开发并进行测试，测试完成后进行数仓上线，配置 T+1 调度任务写入 MySQL，最后 C端和精准营销系统对 MySQL 数据进行读取。原流程链路复杂，主要体现在流程长、成本高、上线周期长。

**现流程：** 当前明细数据已经在 Doris 上线，当业务方发起需求变更时，只需要拉取元数据管理平台元数据信息，配置查询条件，审批完成后即可上线，上线 SQL 可直接在 Doris 中进行即席查询。相比原流程，现在的流程大幅缩短了需求变更流程，只需进行低代码配置，成功降低了开发成本，缩短了上线周期。

# 优化经验

为了规避风险，许多公司的人群包`user_id`是随机生成的，这些`user_id`相差很大且是非连续的。然而，使用非连续的`user_id`进行人群圈选时，会导致 Bitmap 生成速度较慢。因此，我们生成了映射表，并生成了连续稠密的`user_id`。当使用连续 `user_id` 圈选人群时，**速度较之前提升了 70%** 。

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0fcb33643d97446e997f8e3961f58de9~tplv-k3u1fbpfcp-zoom-1.image)

用户 ID 映射表样例数据：从图可知原始用户 ID 由多位数字组合，并且 ID 很稀疏（用户 ID 间相差很大），而连续用户 ID 则 从1开始，且 ID 很稠密。

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cd03622a2587491993f0d0bf9a50eb07~tplv-k3u1fbpfcp-zoom-1.image)

**案例展示：**

1.  用户 ID 映射表：

用户 ID 映射表将用户 ID 作为唯一键模型，而连续用户 ID 则通过用户 ID 来生成，一般从 1 开始，严格保持单调递增。需要注意的是，因为该表使用频繁，因此将 `in_memory` 设置为`true`，直接将其缓存在内存中：

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6e1b14d76edd4d29b1bb8c3fc31a2ef4~tplv-k3u1fbpfcp-zoom-1.image)

2.  人群包表

人群包表是以用户标签作聚合键的模型，假设以 `user_id` 大于 0、小于 2000000 作为圈选条件，使用原始 `user_id` 进行圈选耗费的时间远远远大于连续稠密 `user_id` 圈选所耗时间。

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ef541a3299d642d9a9cd2cd7b353880c~tplv-k3u1fbpfcp-zoom-1.image)

如下图所示，左侧使用 `tyc_user_id`圈选生成人群包响应时间：1843ms，右侧使用使`tyc_user_id_continuous`圈选生成人群包响应时间：543ms。消耗时间大幅缩短

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0b309ad36a774c09ae087e372f4605b7~tplv-k3u1fbpfcp-zoom-1.image)![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/33672f62dca344dfb49863eb24cccb4a~tplv-k3u1fbpfcp-zoom-1.image)

# 规模与收益：

引入 Doris 后，我们已经搭建了 2 个集群，承载的数据规模正随着迁移的推进而持续增大。目前，**我们已经处理的数据总量已经达到了数十TB，单日新增数据量已经达到了 数亿条**，而数据体量还在持续增长中。此外，我们在 Doris 上运行的指标和人群包数量已经超过了 500，分别涵盖了商查、搜索、运营、用户和营收五大类指标。

Doris 的引入满足了业务上的新需求，解决了原有架构的痛点问题，具体表现为以下几点：

-   **降本增效：** Doris 统一了数据的门户，实现了存储和计算的统一，提高了数据/表的复用率，降低了资源消耗。同时，新架构优化了数据到 MySQL、ES 的流程，开发效率得到有效提升。
-   **导入速率提升：** 原有数据流程中，数据处理流程过长，数据的导入速度随着业务体量的增长和数据量的不断上升而急剧下降。引入 Doris 后，我们依赖 Broker Load 优秀的写入能力，使得**导入速率提升了 75%以上**。
-   **响应速度**：Doris 的使用提高了各业务场景中的查询响应速度。例如，在人群圈选场景中，对于 **500 万及以下的人群包进行圈选时，能够做到毫秒级响应**。

![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9359e2a027ff47c992c4efc3a96dac94~tplv-k3u1fbpfcp-zoom-1.image)

# 未来规划

正如前文所讲，Apache Doris 的引入解决了许多架构及业务上的难题，初见成效，同时也收获了公司内部数据部门、业务方的一致好评，未来我们将继续探索，基于 Doris 展开更深度的应用，不久的将来，我们将重点推进以下几个方面工作：

-   离线指标实时化：将更多的指标从离线转为实时，提供更及时的数据服务。
-   搭建数据血缘系统：将代码中的血缘关系重新定义为可视，全面构建数据血缘关系，为问题排查、链路报警等提供有效支持。
-   探索批流一体路线：从使用者的角度思考设计，实现语义开发层的统一，使数据开发更便捷、更低门槛、更高效率。

在此特别感谢 [SelectDB 团队](https://cn.selectdb.com/)，作为基于 [Apache Doris](https://doris.apache.org/zh-CN/) 的商业化公司，为社区投入了大量的研发和用户支持力量，在使用过程中遇到任何问题都能及时响应，为我们降低了许多试错成本。未来，我们也会更积极参与社区贡献及活动中来，与社区共同进步和成长，欢迎大家选择和使用 Doris，相信 Doris 一定不会让你失望。