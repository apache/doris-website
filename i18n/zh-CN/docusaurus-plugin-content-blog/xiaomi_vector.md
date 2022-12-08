---
{
    'title': '最佳实践: Apache Doris 在小米数据场景的应用实践与优化',
    'summary': '小米集团于 2019 年首次引入了 Apache Doris ，目前 Apache Doris 已经在小米内部数十个业务中得到广泛应用，并且在小米内部已经形成一套以 Apache Doris 为核心的数据生态。本篇文章转录自 Doris 社区线上 Meetup 主题演讲，旨在分享 Apache Doris 在小米数据场景的落地实践与优化实践',
    'date': '2022-12-08',
    'author': '魏祚',
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

>导读：小米集团于 2019 年首次引入了 Apache Doris ，目前 Apache Doris 已经在小米内部数十个业务中得到广泛应用，并且在小米内部已经形成一套以 Apache Doris 为核心的数据生态。本篇文章转录自 Doris 社区线上 Meetup 主题演讲，旨在分享 Apache Doris 在小米数据场景的落地实践与优化实践。

>作者｜魏祚 小米 OLAP 引擎研发工程师 

![kv](/images/xiaomi/zh/kv.png)

# 关于小米
小米公司（“小米”或“集团”；HKG：1810），一家消费电子和智能制造公司，其智能手机和智能硬件通过物联网 (IoT) 平台连接。 2021年，小米总收入达到人民币3283亿元（4722.3131.62亿美元），同比增长33.5%；调整后净利润为人民币 220 亿元（316,451.08 万美元），同比增长 69.5%。

因分析业务的增长，小米集团于 2019 年首次引入了 Apache Doris 。经过三年时间的发展，目前 Apache Doris 已经在广告投放、新零售、增长分析、数据看板、用户画像、天星数科、小米有品、等小米内部数十个业务和品牌中得到广泛应用，并且在小米内部已经围绕 Apache Doris 为核心建设了数据生态。

![1](/images/xiaomi/zh/1.png)

当前 Apache Doris 在小米内部已经具有数十个集群、总体达到数百台 BE 节点的规模，其中单集群最大规模达到近百台节点，拥有数十个实时数据同步任务，每日单表最大增量 120 亿、支持 PB 级别存储，单集群每天可以支持 2W 次以上的多维分析查询。

# 架构演进
小米引入 Apache Doris 的初衷是为了解决内部的用户行为分析中所遇到的问题。随着小米互联网业务的发展，利用用户行为数据进行增长分析的需求越来越强烈。如果每个业务产品线都自己搭建一套增长分析系统，不仅成本高昂，效率也不高。因此如果能有一款产品能够帮助他们不用关心底层的复杂技术细节，让相关业务人员能够专注于自己的技术工作，可以极大提高工作效率。所以，小米大数据和云平台联合开发了增长分析系统 Growing Analytics（下文中简称 GA)，旨在提供一个灵活的多维实时查询和分析平台，可以统一管理数据接入和查询方案，帮助业务线做好精细化运营。

## 历史架构
增长分析平台立项于 2018 年年中，当时基于开发时间和成本，技术栈等因素的考虑，小米复用了现有各种大数据基础组件（HDFS, Kudu, SparkSQL 等），搭建了一套基于 Lamda 架构的增长分析查询系统。GA 系统初代版本的架构如下图所示，包含了以下几个方面：
- 数据源：数据源是前端的埋点数据以及用户行为数据。
- 数据接入层：对埋点数据进行统一的清洗后写入小米内部自研的消息队列中，并通过 Spark Streaming 将数据导入Kudu 中。
- 存储层：在存储层中进行冷热数据分离。热数据存放在 Kudu 中，冷数据则会存放在 HDFS 上。同时在存储层中进行分区，当分区单位为天时，每晚会将一部分数据转冷并存储到 HDFS 上。
- 计算层/查询层：在查询层中，使用 SparkSQL 对 Kudu 与 HDFS 上数据进行联邦查询，最终把查询结果显示在前端页面。

![2](/images/xiaomi/zh/2.png)

在当时的历史背景下，初代版本的增长分析平台帮助我们解决了一系列用户运营过程中的问题，但同时在历史架构中也存在了两个问题：

### 第一个问题：组件分散
由于历史架构是基于 SparkSQL + Kudu + HDFS 的组合，依赖的组件过多导致运维成本较高。原本的设计是各个组件都使用公共集群的资源，但是实践过程中发现执行查询作业的过程中，查询性能容易受到公共集群其他作业的影响，容易发生查询抖动，尤其在读取 HDFS 公共集群的数据时，有时较为缓慢。

### 第二个问题：资源占用高
通过 SparkSQL 进行查询时，延迟相对较高。SparkSQL 是基于批处理系统设计的查询引擎，在每个 Stage 之间交换数据 Shuffle 的过程中依然需要进行落盘，完成 SQL 查询的时延较高。为了保证 SQL 查询不受资源的影响，我们通过添加机器来保证查询性能，但是实践过程中发现，性能提升的空间有限，这套解决方案并不能充分地利用机器资源来达到高效查询的目的，存在一定的资源浪费。

针对上述两个问题，我们的目标是寻求一款计算、存储一体的 MPP 数据库来替代我们目前的存储计算层的组件，在通过技术选型后，最终我们决定使用 Apache Doris 替换老一代历史架构。

## 重新选型

MPP架构的查询引擎，如Impala,Presto等能够高效地支持SQL查询，但是仍然需要依赖Kudu, HDFS, Hive Metastore等组件, 运维成本依然比较高。同时，由于计算存储分离，查询引擎不能很好地及时感知存储层的数据变化，就无法做更细致的查询优化。如想在SQL层做缓存就无法保证查询的结果是最新的。

Doris是Apache基金会顶级项目，主要定位是高性能的、支持实时的分析型数据库， 主要用于解决报表和多维分析。它主要集成了 Google Mesa 和 Cloudera Impala 技术。我们对Doris进行了内部的性能测试并多次和社区沟通交流，确定了用Doris替换原来的计算存储组件的解决方案。我们新的架构如下图所示：

## 基于 Apache Doris 的新版架构
新版架构从数据源获取埋点数据后，数据接入后写入 Apache Doris 后可以直接查询结果并在前端进行显示。真正实现了通过Doris统一了计算、存储，和资源管理yarn相关工具。

![3](/images/xiaomi/zh/3.png)

我们选择 Doris 原因：
- Doris 具有优秀的查询性能，能够满足业务需求。
- Doris 支持标准 SQL ，用户使用与学习成本较低。
- Doris 不依赖于其他的外部系统，运维简单。
- Doris 社区拥有很高活跃度，版本迭代快。开发者规模大，有利于后续系统的维护升级。

## 新旧架构性能对比

![4](/images/xiaomi/zh/4.png)

我们选取了日均数据量大约 10 亿的业务，分别在不同场景下对Doris进行了性能测试，其中包含 6 个事件分析场景，3 个留存分析场景以及 3 个漏斗分析场景。经过与【SparkSQL+Kudu+HDFS】的旧方案对比后，我们发现：
- 在事件分析的场景下，平均查询所耗时间降低了 85%。
- 在留存分析和漏斗分析场景下，平均查询所耗时间降低了 50%。

# 应用实践
下面将介绍我们在Apache Doris应用中数据导入、数据查询、A/B测试的经验。

## 数据导入

![5](/images/xiaomi/zh/5.png)

小米内部主要通过 Stream Load 与 Broker Load 以及少量 Insert 方式来导入数据到Doris。数据一般会先写入到消息队列中，分为实时数据和离线数据两个部分。
实时数据如何写入到Apache Doris 中：一部分实时数据通过 Flink数据处理 后， 并通过 Doris 社区提供的 Flink Doris Connector 组件写入到 Doris 中。另一部分数据通过 Spark Streaming 组件写入。这两种写入方式的底层都依赖的是社区提供的 Stream Load。
离线数据如何写入到Apache Doris 中：离线数据部分写入 Hive 后，通过小米的数据工场将数据导入到 Doris 中。用户可以直接在数据工场提交 Broker Load 任务并将数据直接导入 Doris 中，也可以通过 Spark SQL 将数据导入 。Spark SQL 方式则是依赖了 Doris 社区提供的 Spark Doris Connector 组件，其底层为 Doris 的 Stream Load 的封装。

## 数据查询

![6](/images/xiaomi/zh/6.png)

用户通过数据工场将数据导入至 Doris 后即可进行查询。在小米内部，可以通过自研的数鲸平台进行查询的。用户可以通过数鲸平台对 Doris 进行可视化的查询，并展开用户行为分析和用户画像分析。其中，为帮助业务进行事件分析、留存分析、漏斗分析、路径分析等行为分析，我们为 Doris 添加了相应的 UDF （User Defined Function）和 UDAF (User Defined Aggregate Function)。
在即将发布的 1.2 版本中，Doris添加了外表元数据同步的功能，支持 Hive/Hudi/Iceberg 外表并增加了 Multi Catalog。查询外部表提升了性能，接入外表大幅增加了易用性。在未来，我们考虑直接通过 Doris 查询 Hive 与 Iceberg 数据，构建湖仓一体的架构。

## A/B测试
小米的 A/B 实验平台对 Apache Doris 查询性能的提升有着迫切的需求，因此我们选择优先在小米的 A/B 实验平台上线 Apache Doris 向量化版本，也就是 1.1.2 版本。

小米的 A/B 实验平台是一款通过 A/B 测试的方式，借助实验分组、流量拆分与科学评估等手段来辅助完成科学的业务决策，最终实现业务增长的一款运营工具产品。在实际业务中，为了验证一个新策略的效果，通常需要准备原策略 A 和新策略 B 两种方案。随后在总体用户中取出一小部分，将这部分用户完全随机地分在两个组中，使两组用户在统计角度无差别。将原策略 A 和新策略 B 分别展示给不同的用户组，一段时间后，结合统计方法分析数据，得到两种策略生效后指标的变化结果，并以此来判断新策略 B 是否符合预期。

小米的 A/B 实验平台有几类典型的查询应用：用户去重、指标求和、实验协方差计算等，查询类型会涉及较多的 Count(distinct)、Bitmap计算、Like语句等。

### 上线前验证
我们基于 Apache Doris 1.1.2 版本搭建了一个和小米线上 Apache Doris 0.13 版本在机器配置和机器规模上完全相同的测试集群，用于向量化版本上线前的验证。验证测试分为两个方面：单 SQL 串行查询测试和批量 SQL 并发查询测试。在这两种测试中，我们在保证两个集群数据完全相同的条件下，分别在 Doris 1.1.2 测试集群和小米线上 Doris 0.13 集群执行相同的查询 SQL 来做性能对比。我们的目标是，Doris 1.1.2 版本在小米线上 Doris 0.13 版本的基础上有 1 倍的查询性能提升。
两个集群配置完全相同，具体配置信息如下：
- 集群规模：3 FE + 89 BE
- BE节点CPU:  Intel(R) Xeon(R) Silver 4216 CPU @ 2.10GHz 16核 32线程 × 2
- BE节点内存：256GB
- BE节点磁盘：7.3TB × 12 HDD

#### 单 SQL 串行查询测试
在该测试场景中，我们选取了小米A/B 实验场景中 7 个典型的查询 Case，针对每一个查询 Case，我们将扫描的数据时间范围分别限制为 1 天、7 天和 20 天进行查询测试，其中单日分区数据量级大约为 31 亿（数据量大约 2 TB），测试结果如图所示：

![7](/images/xiaomi/zh/7.png)

![8](/images/xiaomi/zh/8.png)

![9](/images/xiaomi/zh/9.png)

根据以上小米 A/B 实验场景下的单 SQL 串行查询测试结果所示，Doris 1.1.2 版本相比小米线上 Doris 0.13 版本至少有 3~5 倍的性能提升，效果显著。

### 调优测试结果
我们基于小米的 A/B实验场景对 Apache Doris 1.1.2 版本进行了一系列调优，并将调优后的 Doris 1.1.2 版本与小米线上 Doris 0.13 版本分别进行了并发查询测试。测试情况如下：

#### 测试 1
我们选择了 A/B 实验场景中一批典型的用户去重、指标求和以及协方差计算的查询 Case（SQL 总数量为 3245）对两个版本进行并发查询测试，测试表的单日分区数据大约为 31 亿（数据量大约 2 TB），查询的数据范围会覆盖最近一周的分区。测试结果如图所示，Doris 1.1.2 版本相比 Doris0.13版本，总体的平均延迟降低了大约 48%，P95 延迟降低了大约 49%。在该测试中，Doris 1.1.2 版本相比 Doris0.13 版本的查询性能提升了接近 1 倍。

![10](/images/xiaomi/zh/10.png)

#### 测试 2
我们选择了 A/B实验场景下的 7 份 A/B 实验报告对两个版本进行测试，每份 A/B 实验报告对应小米 A/B实验平台页面的两个模块，每个模块对应数百或数千条查询 SQL。每一份实验报告都以相同的并发向两个版本所在的集群提交查询任务。测试结果如图所示，Doris 1.1.2 版本相比 Doris 0.13 版本，总体的平均延迟降低了大约 52%。在该测试中，Doris 1.1.2 版本相比 Doris 0.13 版本的查询性能提升了超过 1 倍。

![11](/images/xiaomi/zh/11.png)

#### 测试 3
为了验证调优后的 Apache Doris 1.1.2 版本在小米 A/B 实验场景之外的性能表现，我们选取了小米用户行为分析场景进行了 Doris 1.1.2 版本和 Doris 0.13 版本的并发查询性能测试。我们选取了 2022年10月24日、25日、26日和 27日这 4 天的小米线上真实的行为分析查询 Case 进行对比查询，测试结果如图所示，Doris 1.1.2 版本相比 Doris 0.13 版本，总体的平均延迟降低了大约7 7%，P95 延迟降低了大约 83%。在该测试中，Doris 1.1.2 版本相比 Doris 0.13 版本的查询性能有 4~6 倍的提升。

![12](/images/xiaomi/zh/12.png)

# 总结
自从 Apache Doris 从 2019 年上线第一个业务至今，目前 Apache Doris 已经在小米内部服务了数十个业务及子品牌、集群数量达到数十个、节点规模达到数百台。每天完成数万次用户在线分析查询，承担了包括增长分析和报表查询等绝大多数在线分析的需求。

经过一个多月的性能调优和测试，Apache Doris 1.1.2 版本在查询性能和稳定性方面已经达到了小米 A/B实验平台的上线要求，在某些场景下的查询性能甚至超过了我们的预期，希望本次分享可以给有需要的朋友一些可借鉴的经验参考。

与此同时，在以上小米的实践中，已有部分功能在 Apache Doris 1.0 或 1.1 版本中发布，部分 PR 已经合入社区 Master，将在不久后发布的 1.2 新版本中与大家见面。随着社区的快速发展，有越来越多小伙伴参与到社区建设中，社区活跃度有了极大的提升。Apache Doris 已经变得越来越成熟，并开始从单一计算存储一体的分析型 MPP 数据库走向湖仓一体的道路，相信在未来，还会有更多的数据分析场景被探索和实现。


# 联系我们
官网：http://doris.apache.org

Github：https://github.com/apache/doris

dev邮件组：dev@doris.apache.org

