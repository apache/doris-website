---
{ 
'title': 'Apache Doris 简介',
'language': 'zh-CN' 
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


## Apache Doris 的发展

Apache Doris 是一款基于 MPP 架构的高性能、实时的分析型数据库，以高效、简单、统一的特点被人们所熟知，仅需亚秒级响应时间即可返回海量数据下查询结果，不仅可以支持高并发的点查询场景，也能支持高吞吐的复杂分析场景。基于此，Apache Doris 能够较好的满足报表分析、即席查询、统一数仓构建、数据湖联邦查询加速等使用场景，用户可以在此之上构建大屏看板、用户行为分析、AB 实验平台、日志检索分析、用户画像分析、订单分析等应用。

Apache Doris 最早是诞生于百度广告报表业务的 Palo 项目，2017 年正式对外开源，2018 年 7 月由百度捐赠给 Apache 基金会进行孵化，之后在 Apache 导师的指导下由孵化器项目管理委员会成员进行孵化和运营。2022 年 6 月，Apache Doris 成功从 Apache 孵化器毕业，正式成为 Apache 顶级项目（Top-Level Project，TLP）。目前 Apache Doris 社区已经聚集了来自不同行业数百家企业的 600 余位贡献者，并且每月活跃贡献者人数也超过 120 位。

Apache Doris 如今在中国乃至全球范围内都拥有着广泛的用户群体，截止目前，Apache Doris 已经在全球超过 4000 家中大型企业的生产环境中得到应用，在中国市值或估值排行前 50 的互联网公司中，有超过 80% 长期使用 Apache Doris，包括百度、美团、小米、京东、字节跳动、阿里巴巴、腾讯、网易、快手、微博等。同时在一些传统行业如金融、消费、电信、工业制造、能源、医疗、政务等领域也有着丰富的应用。在中国几乎所有的云商厂比如阿里云、华为云、天翼云、腾讯云、百度云、火山引擎等都在提供托管的 Apache Doris 的云服务。

## 使用场景

如下图所示，数据源经过各种数据集成和加工处理后，通常会入库到实时数据仓库 Doris 和离线湖仓（Hive、Iceberg 与 Hudi  等），广泛应用于 OLAP 分析场景。

![Apache Doris 的使用场景](/images/getting-started/apache-doris-usage-scenarios-pipeline.png)

Apache Doris 被广泛应用在以下场景中：

- 报表服务与即席查询：Doris 提供多维数据分析能力，为企业内部的报表、面相分析是的即系报表查询，面相用户的高并发报表提供稳定高性能服务支撑；
  
- 实时数仓分析：Doris 可以应用于实时数据处理与分析场景，提供秒级同步 TP 数据库的数据变更及亚秒级数据查询能力，服务于实时大屏、实时风控、实时订单分析、实时广告主报表等场景；
  
- 湖仓一体统一分析：Doris 外表联邦分析位于 Hive、Iceberg、Hudi 等离线湖仓中的数据，在避免数据拷贝的前提下，查询性能大幅提升；
  
- 用户画像与行为分析：利用 Doris 内置的行为分析函数与 bitmap 类型可以支撑用户行为分析与画像圈人场景，可以提供高效的查询与实时分析能力，帮助企业快速获取用户洞察，优化用户体验和企业决策；
  
- 日志检索与分析：Doris 支持倒排索引和全文检索，能够很好的满足日志检索分析的场景，并且依赖其高效的查询引擎和存储引擎，相比传统的日志检索分析的方案可以有 10 倍性价比的优势。

## 整体架构

Apache Doris 采用 MySQL 协议，高度兼容 MySQL 语法，支持标准 SQL，用户可以通过各类客户端工具来访问 Apache Doris，并支持与 BI 工具的无缝对接。在部署 Apache 时，可以根据硬件环境与业务需求选择存算一体架构或存算分离架构。

### 存算一体
Apache Doris 存算一体架构精简易于维护，如下图所示，只有两类进程：

- Frontend（FE）：主要负责用户请求的接入、查询解析规划、元数据的管理、节点管理相关工作。
  
- Backend（BE）：主要负责数据存储、查询计划的执行。数据会被切分成分片，在 BE 中多副本存储。

![整体架构和技术特点](/images/getting-started/apache-doris-technical-overview.png)

在生产环境中可以部署多个 FE 节点做容灾备份，每个 FE 中都会维护全量的元数据副本。FE 分为三种角色：

  | 角色     | 功能                                                         |
  | -------- | ------------------------------------------------------------ |
  | Master   | FE Master 节点负责元数据的读写，在 Master 元数据发生变更后，会通过 BDB JE 协议同步给 Follower 或 Observer 节点。 |
  | Follower | Follower 节点负责读取元数据，在 Master 节点发生故障时，Follower 节点可以被选取作为新的 Master 节点。 |
  | Observer | Observer 节点负责读取元数据，主要为了增加集群的查询并发行。不参加集群选主。 |

FE 与 BE 进程都是可以横向扩展的，单集群可以支持到数百台机器，数十 PB 的存储容量。FE 与 BE 进程通过一致性协议来保证服务的高可用和数据的高可靠。存算一体架构高度集成，大幅降低了分布式系统的运维成本。

### 存算分离
自 3.0 版本后，可以选择存算分离部署架构。Apache Doris 存算分离版使用统一的共享存储层作为数据存储空间。存储和计算分离，用户可以独立扩展存储容量和计算资源，从而实现最佳性能和成本效益。如下图所示，存算分离架构分为三层：

- 元数据层：元数据层主要负责请求规划，查询解析规划与元数据的存储与管理；
  
- 计算层：计算层由多个计算组组成，每个计算组可以作为一个独立的租户承担业务计算。在每一个计算组中，有多个无状态的 BE 节点，计算组中可以随时弹性扩缩容 BE 节点；
  
- 存储层：存储层可以使用 S3、HDFS、OSS、COS、OBS、Minio、Ceph 等共享存储存放 Doris 的数据文件，包含包括 Segment 文件、反向索引的索引文件等。

![存算分离整体架构和技术特点](/images/getting-started/apache-doris-technical-compute-storage-decouple-overview.png)

## Apache Doris 的核心特性

- 高可用：在 Apache Doris 中，元数据和数据均采用多副本存储，通过 quorum 协议同步数据日志。当大多数副本完成写入后，即认定数据写入成功，从而确保即使少数节点发生故障，集群仍能保持可用性。Apache Doris 支持同城和异地容灾，能够实现双集群主备模式。当部分节点发生异常时，集群可以自动隔离故障节点，避免影响整体集群的可用性。

- 高兼容：Apache Doris 高度兼容 MySQL 协议，支持标准 SQL 语法，涵盖绝大部分 MySQL 和 Hive 函数。通过这种高兼容性，用户可以无缝地迁移和集成现有的应用和工具。Apache Doris 支持 MySQL 生态，用户可以通过 MySQL Client 工具链接 Doris，使得操作和维护更加便捷，也可以使用 MySQL 协议对 BI 报表工具与数据传输工具进行兼容适配，确保数据分析和数据传输过程中的高效性和稳定性；

- 实时数仓：基于 Apache Doris 可以构建实时数据仓库服务。Apache Doris 提供了秒级数入库能力，上游在线联机事务库中的增量变更可以秒级捕获到 Doris 中，依靠向量化引擎、MPP 架构及 Pipeline 执行引擎等加速手段可以提供亚秒级数据查询能力，从而构建高性能低延迟的实时数仓平台；

- 湖仓一体：Apache 可以基于外部数据源，如数据湖或关系型数据库构建湖仓一体的架构。Apache Doris 湖仓一体解决了数据能够在数据湖和数据仓库之间进行无缝的集成和自由的流转，从而帮助用户直接利用数据仓库的能力来解决数据湖中的数据分析问题，同时又能充分利用数据湖的数据管理能力来提升数据的价值；

- 灵活建模：Apache Doris 提供多种建模方式，如宽表模型、预聚合模型、星型/雪花模型等。数据导入时，可以通过 Flink、Spark 等计算引擎将数据打平成宽表写入到 Doris 中，也可以将数据直接导入到 Doris 中，通过视图、物化视图或实时多表关联等方式进行数据的建模操作。

## 技术特点

Doris 提供了高效的 SQL 接口，并完全兼容 MySQL 协议。其查询引擎基于 MPP（大规模并行处理）架构，能够高效执行复杂的分析查询，并实现低延迟的实时查询。通过列式存储技术对数据进行编码与压缩，显著优化了查询性能和存储压缩比。

### 使用接口

Apache Doris 采用 MySQL 协议，高度兼容 MySQL 语法，支持标准 SQL，用户可以通过各类客户端工具来访问 Apache Doris，并支持与 BI 工具的无缝对接。Apache Doris 当前支持多种主流的 BI 产品，包括不限于 Smartbi、DataEase、FineBI、Tableau、Power BI、Apache Superset 等，只要支持 MySQL 协议的 BI 工具，Apache Doris 就可以作为数据源提供查询支持。

### 存储引擎

在存储引擎方面，Apache Doris 采用列式存储，按列进行数据的编码压缩和读取，能够实现极高的压缩比，同时减少大量非相关数据的扫描，从而更加有效利用 IO 和 CPU 资源。

Apache Doris 也支持比较丰富的索引结构，来减少数据的扫描：

- Sorted Compound Key Index，可以最多指定三个列组成复合排序键，通过该索引，能够有效进行数据裁剪，从而能够更好支持高并发的报表场景
  
- Min/Max Index：有效过滤数值类型的等值和范围查询
  
- BloomFilter Index：对高基数列的等值过滤裁剪非常有效
  
- Inverted Index：能够对任意字段实现快速检索

在存储模型方面，Apache Doris 支持多种存储模型，针对不同的场景做了针对性的优化：

- 聚合模型（Aggregate Key Model）：相同 Key 的 Value 列合并，通过提前聚合大幅提升性能
  
- 主键模型（Unique Key Model）：Key 唯一，相同 Key 的数据覆盖，实现行级别数据更新
  
- 明细模型（Duplicate Key Model）：明细数据模型，满足事实表的明细存储

Apache Doris 也支持强一致的物化视图，物化视图的更新和选择都在系统内自动进行，不需要用户手动选择，从而大幅减少了物化视图维护的代价。

### 查询引擎

在查询引擎方面，Apache Doris 采用 MPP 的模型，节点间和节点内都并行执行，也支持多个大表的分布式 Shuffle Join，从而能够更好应对复杂查询。

![查询引擎](/images/getting-started/apache-doris-query-engine-1.png)

Apache Doris 查询引擎是向量化的查询引擎，所有的内存结构能够按照列式布局，能够达到大幅减少虚函数调用、提升 Cache 命中率，高效利用 SIMD 指令的效果。在宽表聚合场景下性能是非向量化引擎的 5-10 倍。

![Doris 查询引擎是向量化](/images/getting-started/apache-doris-query-engine-2.png)

Apache Doris 采用了自适应查询执行（Adaptive Query Execution）技术， 可以根据 Runtime Statistics 来动态调整执行计划，比如通过 Runtime Filter 技术能够在运行时生成 Filter 推到 Probe 侧，并且能够将 Filter 自动穿透到 Probe 侧最底层的 Scan 节点，从而大幅减少 Probe 的数据量，加速 Join 性能。Apache Doris 的 Runtime Filter 支持 In/Min/Max/Bloom Filter。

在优化器方面，Apache Doris 使用 CBO 和 RBO 结合的优化策略，RBO 支持常量折叠、子查询改写、谓词下推等，CBO 支持 Join Reorder。目前 CBO 还在持续优化中，主要集中在更加精准的统计信息收集和推导，更加精准的代价模型预估等方面。

