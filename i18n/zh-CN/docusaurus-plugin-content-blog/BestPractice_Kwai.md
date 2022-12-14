---
{
    'title': 'Doris on Es在快手商业化的最佳实践',
    'language": "zh',
    'summary': "快手商业化报表引擎为外部广告主提供广告投放效果的实时多维分析报表在线查询服务，以及为内部各商业化系统提供多维分析报表查询服务，致力于解决多维分析报表场景的高性能、高并发、高稳定的查询问题。早期Druid on Es的架构含有诸多弊端，通过调研我们选择了Doris on Es的数仓解决方案。使用Doris 之后，查询变得简单。我们仅需要按天同步事实表和维表，在查询的同时 Join即可。通过Doris替代Druid、Clickhouse的方案，基本覆盖了我们使用Druid 时的所有场景，大大提高了海量数据的聚合分析能力。在Apache Doris的使用过程中，我们还发现了一些意想不到的收益：例如，Routine Load和 Broker Load的导入方式较为简单，提升了查询速度；数据占用空间大幅降低；Doris支持MySQL协议，方便了数据分析师自助取数绘图等。",
    'date': '2022-12-14',
    'author': '贺祥',
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

> 作者：贺祥，数据架构高级工程师，快手商业化团队

![kv](/images/Kwai/zh/kv.png)

# 1 关于快手

## 1.1 快手

快手（HKG: 1024）是一个短视频和潮流社交网络。发现有趣的短片，通过生活中的录音、视频、玩日常挑战或喜欢最好的动效模版和视频来为虚拟社区做出贡献。用短视频分享生活，并从数十种神奇的效果和滤镜中选择喜欢的方式。

## 1.2 快手商业化报表引擎

快手商业化报表引擎为外部广告主提供广告投放效果的实时多维分析报表在线查询服务，以及为内部各商业化系统提供多维分析报表查询服务，致力于解决多维分析报表场景的高性能、高并发、高稳定的查询问题。

# 2 初期架构

## 2.1 需求背景

传统 OLAP 引擎应对多维分析时更多是以预建模的方式，通过构建数据立方体（Cube）对事实数据进行下钻、上卷、切片、切块等操作。现代 OLAP 分析引入了关系模型的理念，在二维关系表中描绘数据。而在建模过程中，往往有两种建模方式，一是采用宽表模型、将多张表的数据通过 Join 写入进一张宽表中，另一种方式是采用星型模型、将数据表区分为事实表和维度表、查询时对事实表与维度表进行 Join 。
以上两种方案各有部分优缺点：

宽表模型：

采取空间换时间的思路，理论上都是维表主键为唯一 ID 来填充所有维度，冗余存储了多条维度数据。其优势在于查询时非常方便，无需关联额外维表，性能表现更佳。其弊端在于如果有维度数据变化，需要对全表数据进行重刷，无法支撑高频的 Update。

星型模型：

维度数据与事实数据完全分离，维度数据往往用专门的引擎存储 (如 MySQL、Elasticsearch 等)，查询时通过主键关联查询维度数据，其优势在于维度数据变化不影响事实数据、可支持高频 Update 操作。其弊端在于查询逻辑相对更复杂，且多表 Join 可能导致性能受损。

## 2.2 业务需求

在快手的业务场景中，商业化报表引擎承载了外部广告主实时查询广告投放效果的需求，在构建报表引擎时，我们期望可以满足如下要求：
- 超大数据量：单表原始数据每天增量百亿
- 查询高 QPS：平均 QPS千级别
- 高稳定性要求：在线服务要求稳定性4个9
最为重要的是，由于维度数据经常发生变更，维度表需要支持高达上千 QPS 的 Update 操作，同时还要进一步支持模糊匹配、分词检索等需求。
基于以上需求，我们选择了星型模型来建模，并以 Apache Druid 和 Elasticsearch 为核心构建了早期的报表引擎架构。

## 2.3 初期架构：基于Apache Druid的架构

我们选择了引擎结合的方式，用Elasticsearch适配Druid引擎来实现。在数据写入阶段，我们通过Flink对数据进行分钟级预聚合，利用Kafka对数据进行小时级别的数据预聚合。在数据查询中，App端发起查询需求，对RE Front统一接口进行查询，Re Query根据引擎适配，向维表引擎（Elasticsearch和MySQL）及扩展引擎分别发起查询。

Druid则是一款基于时序的查询引擎，支持数据实时摄入，用来存储和查询大量的事实数据。而选用Elasticsearch作为维度数据存储引擎，主要是因为如下原因：
- 支持高频实时更新，可以支撑上千 QPS的 Update操作
- 支持分词模糊检索，适用于快手的业务
- 支持量级较高的维表数据，不用像MySQL数据库一样做分库分表才能满足
- 支持数据同步监控，同时拥有检查和恢复的服务

## 2.4 报表引擎

报表引擎架构整体分为REFront 和 REQuery两层，REMeta为独立的元数据管理模块。报表引擎在REQuery内部实现MEM Join。支持Druid引擎中的事实数据与ES引擎中的维度数据做关联查询。为上层业务提供虚拟的cube表查询。屏蔽复杂的跨引擎管理查询逻辑。

![1](/images/Kwai/zh/1.png)

## 3 基于Apache Doris的架构

## 3.1 架构遗留的问题

首先，我们在使用报表引擎时，发现了这样的一个问题。Mem Join是单机实现与串行执行，到单次从ES中拉取的数据量超过10W时，响应时间已经接近10s，用户体验差。而且单节点实现大规模数据Join处理，内存消耗大，有Full GC风险。

其次，Druid的Lookup Join了功能不够完善是一个较大的问题，不能完全满足真实业务需求。

## 3.2 选型调研

于是我们对业界常见的 OLAP 数据库进行了调研，其中最具代表性的为 Apache Doris和 Clickhouse。在进一步的调研中我们发现，Apache Doris在大宽表Join的能力更强。ClickHouse能够支持 Broadcast 基于内存的Join，但是对于大数据量千万级以上大宽表的Join，ClickHouse 的性能表现不好。Doris 和 Clickhouse 都支持明细数据存储，但Clickhouse支持的并发度较低，相反Doris支持高并发低延时的查询服务，单机最高支持上千QPS。在并发增加时，线性扩充FE和BE即可支持。而Clickhouse的数据导入没有事务支持功能，无法实现exactly once语义，对标准sql的支持也是有限的。相比之下，Doris提供了数据导入的事务支持和原子性，Doris 自身能够保证不丢不重的订阅 Kafka 中的消息，即 Exactly-Once 消费语义。ClickHouse使用门槛高、运维成本高和分布式能力弱，需要较多的定制化和较深的技术实力也是另一个难题，Doris则不同，只有FE、BE两个核心组件，外部依赖也比较少，运维快捷简单。我们还发现，由于Doris 更加接近 MySQL协议，比起Clickhouse更加便捷，在迁移时的成本并不大。在横向扩容方面，Doris 的扩缩容也能够做到自平衡，大大优于Clickhouse。

由此看来Doris可以比较好的提升Join的性能，在迁移成本、横向扩容、并发程度等其他方面也比较优秀。不过在高频Update上，Elasticsearch具有先天的优势。

通过 Doris 创建 ES 外表的方式来同时应对高频Upate和Join性能问题，会是比较理想的解决方案。

## 3.3 Doris+Doris on ES完美配合

Doris on ES 的查询性能究竟如何呢？

首先，Apache Doris 是一个基于MPP 架构的实时分析型数据库，性能强劲、横向扩展能力能力强。Doris on ES构建在这个能力之上，并且对查询做了大量的优化。其次，在这些之上，融合Elasticsearch的能力之后，我们还对查询功能做出了大量的优化：
- Shard级别并发
- 行列扫描自动适配，优先列式扫描
- 顺序读取，提前终止
- 两阶段查询变为一阶段查询
- Join场景使用Broadcast Join，对于小批量数据Join特别友好

![2](/images/Kwai/zh/2.png)

## 3.4 基于Doris on Elasticsearch的架构实现

### 3.4.1 数据链路升级

数据链路的升级适配比较简单。第一步，由Doris构建新的Olap表，配置好物化视图。第二步，基于之前事实数据的kafka topic启动routine load，导入实时数据。第三步，从Hive中通broker load导入离线数据。最后一步，通过Doris创建Es外表。

![3](/images/Kwai/zh/3.png)

### 3.4.2 报表引擎适配升级

![4](/images/Kwai/zh/4.png)

注：上图关联的mysql维表是基于未来规划，目前主要是ES做维表引擎

报表引擎适配
- 抽象基于Doris的星型模型虚拟cube表
- 适配cube表查询解析，智能下推
- 支持灰度上线

# 4  线上表现

## 4.1 查询响应时间

### 4.1.1 事实表查询表现对比

Druid

![5](/images/Kwai/zh/5.png)

Doris

![6](/images/Kwai/zh/6.png)

99分位耗时Druid大概为270ms，Doris为150ms，延时下降45%

### 4.1.2 Join场景下cube表查询表现对比

Druid

![7](/images/Kwai/zh/7.png)

Doris

![8](/images/Kwai/zh/8.png)

99分位耗时Druid大概为660ms，Doris为440ms，延时下降33%

### 4.1.3 收益总结

- P99整体耗时下降35%左右
- 资源节省50%左右
- 去除报表引擎内部Mem Join的复杂逻辑，下沉至Doris通过DOE实现，在大查询场景下(维表结果超过10W，性能提升超过10倍，10s->1s)
- 更丰富的查询语义(原本Mem Join实现比较简单，不支持复杂的查询)

# 5  总结与未来规划

在快手商业化业务里面，维度数据与事实数据Join查询是非常普遍的。使用Doris 之后，查询变得简单。我们仅需要按天同步事实表和维表，在查询的同时 Join即可。通过Doris替代Druid、Clickhouse的方案，基本覆盖了我们使用Druid 时的所有场景，大大提高了海量数据的聚合分析能力。在Apache Doris的使用过程中，我们还发现了一些意想不到的收益：例如，Routine Load和 Broker Load的导入方式较为简单，提升了查询速度；数据占用空间大幅降低；Doris支持MySQL协议，方便了数据分析师自助取数绘图等。

尽管Doris on ES的解决方案比较成功的满足了我们的报表业务，ES外表映射仍然需要手工建表。但Apache Doris于近日完成了最新版本V1.2.0的发布，新版本功能新增了Multi-Catlog，提供了无缝接入Hive、ES、Hudi、Iceberg 等外部数据源的能力。用户可以通过 CREATE CATALOG 命令连接到外部数据源，Doris 会自动映射外部数据源的库、表信息。如此一来，以后我们就不需要再手动创建Es外表完成映射，大大节省了开发的时间成本，提升了研发效率。而全面向量化、Ligt Schema Change、Merge-on-Write、Java UDF等其他新功能的实现，也让我们对Apache Doris有了全新的期待。祝福Apache Doris！


# 联系我们

官网：http://doris.apache.org

Github：https://github.com/apache/doris

dev邮件组：dev@doris.apache.org
