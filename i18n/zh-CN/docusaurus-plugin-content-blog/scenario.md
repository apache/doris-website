---
{
    'title': '打造自助对话式数据分析场景，Apache Doris 在思必驰的应用实践｜最佳实践',
    'summary': '思必驰于 2019 年首次引入 Apache Doris ，基于 Apache Doris 构建了实时与离线一体的数仓架构。相对于过去架构，Apache Doris 凭借其灵活的查询模型、极低的运维成本、短平快的开发链路以及优秀的查询性能等诸多方面优势，如今已经在实时业务运营、自助/对话式分析等多个业务场景得到运用，满足了 设备画像/用户标签、业务场景实时运营、数据分析看板、自助 BI、财务对账等多种数据分析需求',
    'date': '2022-07-20',
    'author': '赵伟',
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

> 作者：赵伟，思必驰大数据高级研发，10年大数据开发和设计经验，负责大数据平台基础技术和OLAP分析技术开发。社区贡献：Doris-spark-connector 的实时读写和优化。

# 业务背景

思必驰是国内专业的对话式人工智能平台公司，拥有全链路的智能语音语言技术，致力于成为全链路智能语音及语言交互的平台型企业，自主研发了新一代人机交互平台 DUI 和人工智能芯片 TH1520，为车联网、IoT 及政务、金融等众多行业场景合作伙伴提供自然语言交互解决方案。

思必驰于 2019 年首次引入 Apache Doris ，基于 Apache Doris 构建了实时与离线一体的数仓架构。相对于过去架构，Apache Doris 凭借其灵活的查询模型、极低的运维成本、短平快的开发链路以及优秀的查询性能等诸多方面优势，如今已经在实时业务运营、自助/对话式分析等多个业务场景得到运用，满足了 设备画像/用户标签、业务场景实时运营、数据分析看板、自助 BI、财务对账等多种数据分析需求。在这一过程中我们也积累了诸多使用上的经验，在此分享给大家。

# 架构演进

早期业务中离线数据分析是我们的主要需求，近几年，随着业务的不断发展，业务场景对实时数据分析的要求也越来越高，早期数仓架构逐渐力不从心，暴露出很多问题。为了满足业务场景对查询性能、响应时间及并发能力更高的要求，2019年正式引入 Apache Doris 构建实时离线一体的数仓架构。

以下将为大家介绍思必驰数仓架构的演进之路，早期数仓存在的优缺点，同时分享我们选择 Apache Doris 构建新架构的原因以及面临的新问题与挑战。

## 早期数仓架构及痛点

![data_wharehouse_architecture_v1_0_git](/images/data_wharehouse_architecture_v1_0_git.png)

如上图所示，早期架构基于 Hive +Kylin 来构建离线数仓，实时数仓架基于 Spark+MySQL 来构建实时分析数仓。

我们业务场景的数据源主要分为三类，业务数据库如 MySQL，应用系统如 K8s 容器服务日志，还有车机设备终端的日志。数据源通过 MQTT/HTTP 协议、业务数据库 Binlog 、Filebeat日志采集等多种方式先写入 Kafka 。在早期架构中，数据经 Kafka 后将分为实时和离线两条链路，首先是实时部分，实时部分链路较短，经过 Kafka 缓冲完的数据通过 Spark 计算后放入 MySQL 中进行分析，对于早期的实时分析需求，MySQL 基本可以满足分析需求。而离线部分则由 Spark 进行数据清洗及计算后在 Hive 中构建离线数仓，并使用 Apache Kylin 构建 Cube，在构建 Cube 之前需要提前做好数据模型的的设计，包括关联表、维度表、指标字段、指标需要的聚合函数等，通过调度系统进行定时触发构建，最终使用 HBase 存储构建好的 Cube。

### **早期架构的优势：**

1.  早期架构与 Hive 结合较好，无缝对接 Hadoop 技术体系。

2.  离线数仓中基于 Kylin 的预计算、表关联、聚合计算、精确去重等场景，查询性能较高，在并发场景下查询稳定性也较高。

早期架构解决了当时业务中较为紧迫的查询性能问题，但随着业务的发展，对数据分析要求不断升高，早期架构缺点也开始逐渐凸显出来。

### **早期架构的痛点：**

1.  依赖组件多。Kylin 在 2.x、3.x 版本中强依赖 Hadoop 和 HBase ，应用组件较多导致开发链路较长，架构稳定性隐患多，维护成本比很高。

2.  Kylin 的构建过程复杂，构建任务容易失败。Kylin 构建需要进行打宽表、去重列、生成字典，构建 Cube 等如果每天有 1000-2000 个甚至更多的任务，其中至少会有 10 个甚至更多任务构建失败，导致需要大量时间去写自动运维脚本。

3.  维度/字典膨胀严重。维度膨胀指的是在某些业务场景中需要多个分析条件和字段，如果在数据分析模型中选择了很多字段而没有进行剪枝，则会导致 Cube 维度膨胀严重，构建时间变长。而字典膨胀指的是在某些场景中需要长时间做全局精确去重，会使得字典构建越来越大，构建时间也会越来越长，从而导致数据分析性能持续下降。

4.  数据分析模型固定，灵活性较低。在实际应用过程中，如果对计算字段或者业务场景进行变更，则要回溯部分甚至全部数据。

5.  不支持数据明细查询。早期数仓架构是无法提供明细数据查询的，Kylin 官方给的解决方法是下推给 Presto 做明细查询，这又引入了新的架构，增加了开发和运维成本。

## 架构选型

为解决以上问题，我们开始探索新的数仓架构优化方案，先后对市面上应用最为广泛的 Apache Doris、Clickhouse 等 OLAP 引擎进行选型调研。相较于 ClickHouse 的繁重运维、各种各样的表类型、不支持关联查询等，结合我们的 OLAP 分析场景中的需求，综合考虑，Apache Doris 表现较为优秀，最终决定引入 Apache Doris 。

## 新数仓架构

![data_wharehouse_architecture_v2_0_git](/images/data_wharehouse_architecture_v2_0_git.png)

如上图所示，我们基于 Apache Doris 构建了实时+离线一体的新数仓架构，与早期架构不同的是，实时和离线的数据分别进行处理后均写入 Apache Doris 中进行分析。

因历史原因数据迁移难度较大，离线部分基本和早期数仓架构保持一致，在Hive上构建离线数仓，当然完全可以在Apache Doris 上直接构建离线数仓。

相对早期架构不同的是，离线数据通过 Spark 进行清洗计算后在 Hive 中构建数仓，然后通过 Broker Load 将存储在 Hive 中的数据写入到 Apache Doris 中。这里要说明的， Broker Load 数据导入速度很快，天级别 100-200G 数据导入到 Apache Doris 中仅需要 10-20 分钟。

实时数据流部分，新架构使用了 Doris-Spark-Connector 来消费 Kafka 中的数据并经过简单计算后写入 Apache Doris 。从架构图所示，实时和离线数据统一在 Apache Doris 进行分析处理，满足了数据应用的业务需求，实现了实时+离线一体的数仓架构。

### **新架构的收益：**

1.  极简运维，维护成本低，不依赖 Hadoop 生态组件。Apache Doris 的部署简单，只有 FE 和 BE 两个进程， FE 和 BE 进程都是可以横向扩展的，单集群支持到数百台机器，数十 PB 的存储容量，并且这两类进程通过一致性协议来保证服务的高可用和数据的高可靠。这种高度集成的架构设计极大的降低了一款分布式系统的运维成本。在使用 Doris 三年时间中花费的运维时间非常少，相比于基于 Kylin 搭建的早期架构，新架构花费极少的时间去做运维。

2.  链路短，开发排查问题难度大大降低。基于 Doris 构建实时和离线统一数仓，支持实时数据服务、交互数据分析和离线数据处理场景，这使得开发链路变的很短，问题排查难度大大降低。

3.  支持 Runtime 形式的 Join 查询。Runtime 类似 MySQL 的表关联，这对数据分析模型频繁变更的场景非常友好，解决了早期结构数据模型灵活性较低的问题。

4.  同时支持 Join、聚合、明细查询。解决了早期架构中部分场景无法查询数据明细的问题。

5.  支持多种加速查询方式。支持上卷索引，物化视图，通过上卷索引实现二级索引来加速查询，极大的提升了查询响应时间。

6.  支持多种联邦查询方式。支持对 Hive、Iceberg、Hudi 等数据湖和 MySQL、Elasticsearch 等数据库的联邦查询分析。

### **问题和挑战：**

在建设新数仓架构过程中，我们遇到了一些问题：

-   高并发场景对 Apache Doris 查询性能存在一定影响。我们分别在 Doris 0.12 和 Doris 1.1版本上进行测试，同一时间同样的 SQL，10 并发和 50 并发进行访问，性能差别较大。

-   在实时写入场景中，当实时写入的数据量比较大时，会使得 IO 比较密集，导致查询性能下降。

-   大数据量下字符串精确去重较慢。目前使用的是 count distinct 函数、Shuffle 和聚合算子去重，此方式算力比较慢。当前业内常见的解决方法一般是针对去重列构建字典，基于字典构建 Bitmap 索引后使用 Bitmap 函数去重。目前 Apache Doris 只支持数字类型的 Bitmap 索引，具有一定的局限性。

# 业务场景的应用

Apache Doris 在思必驰最先应用在实时运营业务场景以及自助/对话式分析场景，本章节将介绍两个场景的需求及应用情况。

## 实时运营业务场景

![real-time_operation_git](/images/real-time_operation_git.png)

首先是实时运营业务场景，如上图所示，实时运营业务场景的技术架构和前文所述的新版数仓架构基本一致：

-   数据源：数据源新版架构图中一致，包括 MySQL 中的业务数据，应用系统埋点数据以及设备和终端日志。

-   数据导入：离线数据导入使用 Broker Load，实时数据导入使用 Doris-Spark-Connector 。

-   数据存储与开发：几乎所有的实时数仓全部在 Apache Doris 构建，有一部分离线数据放在 Airflow 上执行 DAG 跑批任务。

-   数据应用：最上层是业务侧提出的业务分析需求，包括大屏展示，数据运营的实时看板、用户画像、BI 看板等。

**在实时运营业务场景中，数据分析的需求主要有两方面：**

-   由于实时导入数据量比较大，因此对实时数据的查询效率要求较高

-   在此场景中，有 20+ 人的团队在运营，需要同时开数据运营的看板，因此对实时写入的性能和查询并发会有比较高的要求。

## 自助/对话式分析场景

除以上之外，Apache Doris 在思必驰第二个应用是自助/对话式分析场景。

![ai_chatbots_git](/images/ai_chatbots_git.png)

如上图所示，在一般的 BI 场景中，用户方比如商务、财务、销售、运营、项目经理等会提出需求给数据分析人员，数据分析人员在 BI 平台上做数据看板，最终把看板提供给用户，用户从 BI 看板上获取所需信息，但是有时候用户想要查看明细数据、定制化的看板需求，或者在某些场景需做任意维度的上卷或者下钻的分析，一般场景下 BI 看板是不支持的的，基于以上所述用户需求，我们打造了自助对话式 BI 场景来解决用户定制化的需求。

与一般 BI 场景不同的是，我们将自助/对话式 BI 场景从数据分析人员方下沉到用户方，用户方只需要通过打字，描述数据分析的需求。基于我们公司自然语言处理的能力，自助/对话式 BI 场景会将自然语言转换成SQL，类似 NL2SQL 技术，需要说明的是这里使用的是定制的自然语言解析，相对开源的 NL2SQL 命中率高、解析结果更精确。当自然语言转换成 SQL 后，将 SQL 给到 Apache Doris 查询得到分析结果。由此，用户通过打字就可以随时查看任意场景下的明细数据，或者任意字段的上卷、下钻。

相比 Apache Kylin、Apache Druid 等预计算的 OLAP 引擎，Apache Doris 符合以下几个特点：

-   查询灵活，模型不固定，支持自由定制场景。

-   支持表关联、聚合计算、明细查询。

-   响应时间要快速。

因此我们很顺利的运用 Apache Doris 实现了自助/对话式分析场景。同时，自助/对话式分析在我们公司多个数据分析场景应用反馈非常好。

# 实践经验

基于上面的两个场景，我们使用过程当中积累了一些经验和心得，分享给大家。

### **数仓** **表设计：**

1.  千万级(量级供参考，跟集群规模有关系)以下的数据表使用 Duplicate 表类型，Duplicate 表类型同时支持聚合、明细查询，不需要额外写明细表。

2.  当数据量比较大时，使用 Aggregate 聚合表类型，在聚合表类型上做上卷索引，使用物化视图优化查询、优化聚合字段。由于 Aggregate 表类型是预计算表，会丢失明细数据，如有明细查询需求，需要额外写一张明细表。

3.  当数据量又大、关联表又多时，可用 ETL 先写成宽表，然后导入到 Doris，结合 Aggregate 在聚合表类型上面做优化，也可以使用官方推荐Doris 的 Join 优化：<https://doris.apache.org/zh-CN/docs/dev/advanced/join-optimization/doris-join-optimization>

### **写入：**

1.  通过 Spark Connector 或 Flink Connector 替代 Routine Load： 最早我们使用的是 Routine Load 实时写入 BE 节点， Routine Load 的工作原理是通过 SQL 在 FE 节点起一个类似于 Task Manager 的管理，把任务分发给 BE 节点，在 BE 节点起 Routine Load 任务。在我们实时场景并发很高的情况下，BE 节点 CPU 峰值一般会达到 70% 左右，在这个前提下，Routine Load 也跑到 BE 节点，将严重影响 BE 节点的查询性能，并且查询 CPU 也将影响 Routine Load 导入， Routine Load 就会因为各种资源竞争死掉。面对此问题，目前解决方法是将 Routine Load 从 BE 节点拿出来放到资源调度上，用 Doris-Spark/Flink-Connector 替换 Routine Load。当时 Doris-spark-Connector 还没有实时写入的功能，我们根据业务需求进行了优化，并将方案贡献给社区。

2.  通过攒批来控制实时写入频率：当实时写入频率较高时，小文件堆积过多、查询 IO 升高，小文件排序归并的过程将导致查询时间加长，进而出现查询抖动的情况。当前的解决办法是控制导入频次，调整 Compaction 的合并线程、间隔时间等参数，避免 Tablet 下小文件的堆积。

### 查询：

1.  增加 SQL 黑名单，控制异常大查询。个别用户在查询时没有加 where 条件，或者查询时选择的时间范围较长，这种情况下 BE 节点的 SQL 会把磁盘的负载和 CPU 拉高，导致其他节点的 SQL 查询变慢，甚至出现 BE 节点宕机的情况。目前的解决方案是使用 SQL 黑名单禁止全表及大量分区实时表的查询。

2.  使用 SQL Cache 和 SQL Proxy 实现高并发访问。同时使用 SQL Cache 和 SQL Proxy 的原因在于，SQL Cache的颗粒度到表的分区，如果数据发生变更， SQL Cache 将失效，因此 SQL Cache 缓存适合数据更新频次较低的场景（离线场景、历史分区等）。对于数据需要持续写到最新分区的场景， SQL Cache 则是不适用的。当 SQL Cache 失效时 Query 将全部发送到 Doris 造成重复的 Runtime 计算，而 SQL Proxy 可以设置一秒左右的缓存，可以避免相同条件的重复计算，有效提高集群的并发。

### 存储：

使用 SSD 和 HDD 做热温数据存储周期的分离，近一年以内的数据存在 SSD，超过一年的数据存在 HDD。Apache Doris 支持对分区设置冷却时间，但只支持创建表分区时设置冷却的时间，目前的解决方案是设置自动同步逻辑，把历史的一些数据从 SSD 迁移到 HDD，确保 1年内的数据都放在 SSD 上。

### 升级：

升级前一定要备份元数据，也可以使用新开集群的方式，通过 Broker 将数据文件备份到 S3 或 HDFS 等远端存储系统中，再通过备份恢复的方式将旧集群数据导入到新集群中。

## **升级前后性能对比**

![doris_1_1_performance_test_git](/images/doris_1_1_performance_test_git.png)

思必驰最早是从 0.12 版本开始使用 Apache Doris 的，在今年我们也完成了从 0.15 版本到最新 1.1 版本的升级操作，并进行了基于真实业务场景和数据的性能测试。

从以上测试报告中可以看到，总共 13 个测试 SQL 中，前 3 个 SQL 升级前后性能差异不明显，因为这 3 个场景主要是简单的聚合函数，对 Apache Doris 性能要求不高，0.15 版本即可满足需求。而在 Q4 之后的场景中 ，SQL 较为复杂，Group By 有多个字段、多个字段聚合函数以及复杂函数，因此升级新版本后带来的性能提升非常明显，平均查询性能较 0.15 版本提升 2-3 倍。由此，非常推荐大家去升级到 Apache Doris 最新版本。

# 总结和收益

1.  Apache Doris 支持构建离线+实时统一数仓，一个 ETL 脚本即可支持实时和离线数仓，大大缩短开发周期，降低存储成本，避免了离线和实时指标不一致等问题。

2.  Apache Doris 1.1.x 版本开始全面支持向量化计算，较之前版本查询性能提升 2-3 倍。经测试，Apache Doris 1.1.x 版本在宽表场景的查询性能已基本与 ClickHouse 持平。

3.  功能强大，不依赖其他组件。相比 Apache Kylin、Apache Druid、ClickHouse 等，Apache Doris 不需要引入第 2 个组件填补技术空档。Apache Doris 支持聚合计算、明细查询、关联查询，当前思必驰超 90% 的分析需求已移步 Apache Doris实现。 得益于此优势，技术人员需要运维的组件减少，极大降低运维成本。

4.  易用性极高，支持 MySQL 协议和标准 SQL，大幅降低用户学习成本。

# 未来计划

1.  Tablet 小文件过多的问题。Tablet 是 Apache Doris 中读写数据最小的逻辑单元，当 Tablet 小文件比较多时会产生 2 个问题，一是 Tablet 小文件增多会导致元数据内存压力变大。二是对查询性能的影响，即使是几百兆的查询，但在小文件有几十万、上百万的情况下，一个小小的查询也会导致 IO 非常高。未来，我们将做一个 Tablet 文件数量/大小比值的监控，当比值在不合理范围内时及时进行表设计的修改，使得文件数量和大小的比值在合理的范围内。

2.  支持基于 Bitmap 的字符串精确去重。业务中精确去重的场景较多，特别是基于字符串的 UV 场景，目前 Apache Doris 使用的是 Distinct 函数来实现的。未来我们会尝试的在 Apache Doris 中创建字典，基于字典去构建字符串的 Bitmap 索引。

3.  Doris-Spark-Connector 流式写入支持分块传输。Doris-Spark-Connector 底层是复用的 Stream Load，工作机制是攒批，容易出现两个问题，一是攒批可能会会出现内存压力导致 OOM，二是当Doris-Spark-Connector 攒批时，Spark Checkpoint 没有提交，但 Buffer 已满并提交给 Doris，此时 Apacche Doris 中已经有数据，但由于没有提交 Checkpoint，假如此时任务恰巧失败，启动后又会重新消费写入一遍。未来我们将优化此问题，实现 Doris-Spark-Connector 流式写入支持分块传输。
