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

Apache Doris 是一款基于 MPP 架构的高性能实时分析型数据库，以其高效、简单、统一的特点而闻名。它能够在亚秒级响应时间内处理海量数据查询，支持高并发的点查询和高吞吐的复杂分析场景。Apache Doris 广泛应用于报表分析、即席查询、统一数仓构建、数据湖联邦查询加速等场景，用户可基于其构建大屏看板、用户行为分析、AB 实验平台、日志检索分析、用户画像分析、订单分析等应用。

Apache Doris 最初是百度广告报表业务的 Palo 项目，2017 年开源，2018 年 7 月由百度捐赠给 Apache 基金会孵化。2022 年 6 月，Apache Doris 成功从孵化器毕业，成为 Apache 顶级项目（Top-Level Project, TLP）。目前，Apache Doris 社区已聚集了来自不同行业的 600 余位贡献者，每月活跃贡献者超过 120 位。

Apache Doris 在全球范围内拥有广泛的用户群体，已在超过 4000 家中大型企业的生产环境中应用。在中国市值或估值前 50 的互联网公司中，超过 80% 长期使用 Apache Doris，包括百度、美团、小米、京东、字节跳动、阿里巴巴、腾讯、网易、快手、微博等。此外，Apache Doris 在金融、消费、电信、工业制造、能源、医疗、政务等传统行业也有广泛应用。几乎所有中国云服务商，如阿里云、华为云、天翼云、腾讯云、百度云、火山引擎等，均提供托管的 Apache Doris 云服务。

## 使用场景

如下图所示，数据源经过集成和加工处理后，通常会入库到实时数据仓库 Doris 和离线湖仓（如 Hive、Iceberg 与 Hudi 等），广泛应用于 OLAP 分析场景。

![Apache Doris 的使用场景](/images/getting-started/apache-doris-usage-scenarios-pipeline.png)

Apache Doris 主要应用于以下场景：

- **实时数据分析**：
  
  - **实时报表与决策**：提供实时更新的报表和仪表盘，支持自动化流程中的实时决策需求。
    
  - **交互式探索分析**：支持多维数据分析，帮助用户快速发现商业洞察。
    
  - **用户行为与画像分析**：分析用户参与、留存、转化等行为，支持人群洞察和圈选。

- **湖仓融合分析**：
  - **湖仓查询加速**：通过高效查询引擎加速湖仓数据查询。
    
  - **多源联邦分析**：支持跨数据源的联邦查询，简化架构并消除数据孤岛。
    
  - **实时数据处理**：结合实时数据流和批量数据处理能力，满足高并发和低延迟需求。

- **半结构化数据分析**：
  
  - **日志与事件分析**：支持分布式系统中的日志和事件数据实时或批量分析，帮助定位问题和优化性能。


## 整体架构

Apache Doris 采用 MySQL 协议，高度兼容 MySQL 语法，支持标准 SQL。用户可通过各类客户端工具访问 Apache Doris，并与 BI 工具无缝对接。根据硬件环境和业务需求，Apache Doris 支持存算一体或存算分离架构。

### 存算一体

Apache Doris 的存算一体架构简洁易维护，包含两类进程：

- **Frontend（FE）**：负责用户请求接入、查询解析规划、元数据管理和节点管理。
  
- **Backend（BE）**：负责数据存储和查询计划执行。数据被切分为分片，在 BE 中多副本存储。

![整体架构和技术特点](/images/getting-started/apache-doris-technical-overview.png)

在生产环境中，可部署多个 FE 节点以实现容灾备份。FE 分为三种角色：

| 角色     | 功能                                                         |
| -------- | ------------------------------------------------------------ |
| Master   | 负责元数据的读写，元数据变更通过 BDB JE 协议同步给 Follower 或 Observer 节点。 |
| Follower | 负责读取元数据，Master 故障时可被选为新的 Master 节点。       |
| Observer | 负责读取元数据，增加集群查询并发，不参与选主。                 |

FE 和 BE 进程均可横向扩展，单集群支持数百台机器和数十 PB 存储容量。通过一致性协议，Apache Doris 确保服务高可用和数据高可靠，大幅降低分布式系统的运维成本。

### 存算分离

自 3.0 版本起，Apache Doris 支持存算分离架构。该架构使用共享存储层作为数据存储空间，用户可独立扩展存储容量和计算资源，实现最佳性能和成本效益。存算分离架构分为三层：

- **元数据层**：负责请求规划、查询解析规划与元数据存储管理。
  
- **计算层**：由多个计算组组成，每个计算组可作为一个独立租户承担业务计算。计算组中的 BE 节点可弹性扩缩容。
  
- **存储层**：支持 S3、HDFS、OSS、COS、OBS、Minio、Ceph 等共享存储，存放 Doris 的数据文件。

![存算分离整体架构和技术特点](/images/getting-started/apache-doris-technical-compute-storage-decouple-overview.jpg)

## Apache Doris 的核心特性

- **高可用**：元数据和数据采用多副本存储，通过 quorum 协议同步数据日志。支持同城和异地容灾，实现双集群主备模式。故障节点自动隔离，确保集群高可用。

- **高兼容**：高度兼容 MySQL 协议和标准 SQL 语法，支持 MySQL 和 Hive 函数。用户可通过 MySQL Client 工具连接 Doris，支持 BI 报表工具和数据传输工具。
  
- **实时数仓**：提供秒级数据入库能力，支持亚秒级查询，构建高性能低延迟的实时数仓平台。
  
- **湖仓一体**：支持基于外部数据源（如数据湖或关系型数据库）构建湖仓一体架构，实现数据在数据湖和数据仓库间的无缝集成。
  
- **灵活建模**：支持宽表模型、预聚合模型、星型/雪花模型等多种建模方式，数据导入灵活，支持视图、物化视图和实时多表关联。

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

- 明细模型（Duplicate Key Model）：明细数据模型，满足事实表的明细存储

- 主键模型（Unique Key Model）：Key 唯一，相同 Key 的数据覆盖，实现行级别数据更新

- 聚合模型（Aggregate Key Model）：相同 Key 的 Value 列合并，通过提前聚合大幅提升性能
  
Apache Doris 也支持强一致的单表物化视图，异步刷新的多表物化视图，单表物化视图在系统中自动刷新与维护，无序用户手动选择。多表物化视图可以借助集群内的调度或集群外的调度工具定时刷新，减少数据建模的复杂性。

### 查询引擎

在查询引擎方面，Apache Doris 采用 MPP 的模型，节点间和节点内都并行执行，也支持多个大表的分布式 Shuffle Join，从而能够更好应对复杂查询。

![查询引擎](/images/getting-started/apache-doris-query-engine-1.png)

Apache Doris 查询引擎是向量化的查询引擎，所有的内存结构能够按照列式布局，能够达到大幅减少虚函数调用、提升 Cache 命中率，高效利用 SIMD 指令的效果。在宽表聚合场景下性能是非向量化引擎的 5-10 倍。

![Doris 查询引擎是向量化](/images/getting-started/apache-doris-query-engine-2.png)

Apache Doris 采用了自适应查询执行（Adaptive Query Execution）技术，可以根据 Runtime Statistics 来动态调整执行计划，比如通过 Runtime Filter 技术能够在运行时生成 Filter 推到 Probe 侧，并且能够将 Filter 自动穿透到 Probe 侧最底层的 Scan 节点，从而大幅减少 Probe 的数据量，加速 Join 性能。Apache Doris 的 Runtime Filter 支持 In/Min/Max/Bloom Filter。

![pip_exec_3](/images/pip_exec_3.png)

Apache Doris 使用 Pipeline 执行引擎，将查询拆分成多个子任务并行执行，充分释放多核 CPU 能力，同时通过限制查询线程数目解决线程膨胀问题。Pipeline 执行引擎减少数据拷贝与共享，优化排序与聚合操作，从而显著提高查询效率和吞吐量。

在优化器方面，Apache Doris 使用 CBO、RBO、HBO 结合的优化策略，RBO 支持常量折叠、子查询改写、谓词下推等，CBO 支持 Join Reorder 等优化，HBO 等够基于历史的 Query 信息推荐最优的执行计划。多种优化措施保证 Doris 能够在各类 Query 中都能够枚举出性能优异的查询计划。


