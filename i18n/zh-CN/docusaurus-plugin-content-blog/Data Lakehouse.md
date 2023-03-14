---
{
    'title': '查询性能较 Trino:Presto 3-10 倍提升！Apache Doris 极速数据湖分析深度解读',
    'summary': "Apache Doris 已经完全具备了构建极速易用的 Lakehouse 架构的能力，并且也已在多个用户的真实业务场景中得到验证和推广，希望为用户带来湖仓查询加速
统一数据分析网关、统一数据集成和更加开放的数据生态。",
    'date': '2023-03-14',
    'author': 'Apache Doris',
    'tags': ['技术解析'],
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

从上世纪 90 年代初 Bill Inmon 在《building the Data Warehouse》一书中正式提出数据仓库这一概念，至今已有超过三十年的时间。在最初的概念里，数据仓库被定义为「一个面向主题的、集成的、相对稳定的、反映历史变化的数据集合，用于支持管理决策」，而数据湖最初是为了解决数仓无法存储海量且异构的数据而构建的集中式存储系统。

时代的发展与用户数据应用诉求的演进，催生了数据架构的不断革新，也衍生了更复杂的技术形态。可以清晰看到现代数据架构从计算到存储都在向着融合统一的方向发展，新的数据湖范式被提出，这也是 Lakehouse 诞生的背景。作为一种全新的、开放式的数据管理架构，Lakehouse 提供了更强的数据分析能力与更好的数据治理能力，也保留了数据湖的灵活性与开放式存储，为用户带来更多价值：

-   从存储的角度：统一数据集成，避免冗余存储以及跨系统间 ETL 带来的繁重工程和失败风险；
-   从治理的角度：支持 ACID、Schema Evolution 与 Snapshot，数据与元数据皆可治理；
-   从应用的角度：多引擎访问支持、可插拔，通过统一接口进行数据访问，同时适用于多种工作负载 Workload；
-   ……

如果我们把 Lakehouse 从系统层面进行解构，会发现除了需要 Apache Iceberg、Apache Hudi 以及 Delta Lake 等数据湖表格式（Table Format）以外，**高性能分析引擎更是充分发挥湖上数据价值的关键**。

作为一款极速易用的开源实时 OLAP 数据库，Apache Doris 自 0.15 版本即开始尝试在 Apache Iceberg 之上探索与数据湖的能力结合。而经过多个版本的优化迭代，Apache Doris 在数据湖分析已经取得了长足的进展，一方面在数据读取、查询执行以及优化器方面做了诸多优化，另一方面则是重构了整体的元数据连接框架并支持了更多外部存储系统。因此 Apache Doris 已经完全具备了构建极速易用的 Lakehouse 架构的能力，并且也已在多个用户的真实业务场景中得到验证和推广，我们希望通过 Apache Doris 能为用户在更多场景中带来价值：

1. **湖仓查询加速**

   利用 Apache Doris 优秀的分布式执行引擎以及本地文件缓存，结合数据湖开放格式提供的多种索引能力，对湖上数据及文件提供优秀的查询加速能力，相比 Hive、Presto、Spark 等查询引擎实现数倍的性能提升。

1. **统一数据分析网关**

   利用 Apache Doris 构建完善可扩展的数据源连接框架，便于快速接入多类数据源，包括各种主流关系型数据库、数据仓库以及数据湖引擎（例如 Hive、Iceberg、Hudi、Delta Lake、Flink Table Store 等），提供基于各种异构数据源的快速查询和写入能力，将 Apache Doris 打造成统一的数据分析网关。

1. **统一数据集成**

   基于可扩展的连接框架，增强 Doris 在数据集成方面的能力，让数据更便捷的被消费和处理。用户可以通过 Doris 对上游的多种数据源进行统一的增量、全量同步，并利用 Doris 的数据处理能力对数据进行加工和展示，也可以将加工后的数据写回到数据源，或提供给下游系统进行消费。该能力使得 Apache Doris 能够成为业务的统一数据枢纽，降低数据流转成本。

1. **更加开放的数据生态**

   通过对 Parquet/ORC 等数据格式以及开放的元数据管理机制的支持，用户不用再担心数据被特定数据库引擎锁定，无法被其他引擎访问，也不用再为数据的迁移和格式转换付出高昂的时间和算力成本，降低用户的数据迁移成本和对数据流通性的顾虑，更便捷、放心地享受 Apache Doris 带来的极速数据分析体验。

  


基于以上的场景定位，我们需要进一步去思考在构建 Lakehouse 过程中需要如何去设计和改造系统，具体包括：

-   如何支持更丰富的数据源访问以及更便捷的元数据获取方式；
-   如何提升湖上数据的查询执行性能；
-   如何实现更灵活的资源调度与负载管理；

因此本文将重点介绍 Apache Doris 在 Lakehouse 上的设计思路和技术细节，同时会为大家介绍后续的发展规划。

# 元数据连接与数据访问

截至最新的 1.2.2 版本，Apache Doris 已经提供了十余种的数据湖格式和外部数据源的访问支持。同时也支持通过 Table Value Function 直接对文件进行分析。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/196b5972f51b4ed2a693082ec3f5a56f~tplv-k3u1fbpfcp-zoom-1.image)

  


为了支持这些数据源，Apache Doris 分别在**元数据连接**和**数据访问**两方面做了大量的架构调整和性能优化 **。**

## 元数据连接

元数据包括数据源的库、表信息、分区信息、索引信息、文件信息等。不同数据源的元信息格式、组织方式各有不同，对于元数据的连接需要解决以下问题：

1.  **统一的元数据结构**：屏蔽不同数据源的元数据差异。
1.  **可扩展的元数据连接框架**：低成本、快速地接入数据源。
1.  **高效的元数据访问能力**：提供可靠、高效的元数据访问性能，并支持实时同步元数据变更。
1.  **自定义鉴权服务**：能够灵活对接外部的权限管理系统，降低业务迁移成本。

### **统一的元数据结构**

在过去 Apache Doris 的元数据只有 Database（数据库） 和 Table（表）两个层级，当外部数据目录 Schema 发生变化或者外部数据目录的 Database 或 Table 非常多时，需要用户手工进行一一映射，维护量非常大。因此在 Apache Doris 1.2.0 版本中新增了 Catalog（数据目录）层级，提供了快速接入外部数据源的能力。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/49db6f6b33b84674a7cccbe1edac8159~tplv-k3u1fbpfcp-zoom-1.image)

Catalog 层级的引入解决以下问题：

1.  **数据源层级的映射**：用户不再需要在 Database、Table 层级进行一一映射，可以通过 Catalog 直接映射整个数据源，自动同步其中的所有元信息，简化元数据映射逻辑
1.  **数据源统一信息管理**：在 Catalog 层级统一维护指定数据源的属性，如连接信息、权限信息、同步方式等，更方便的管理多个数据源。

引入 Catalog 层级后，我们也对 Doris 的元数据进行调整和划分：

1.  Internal Catalog：原有的自管理的 Table 和 Database 都归属于 Internal Catalog。
1.  External Catalog：用于对接其他非自管理的外部数据源。比如 HMS External Catalog 可以连接到一个 Hive Metastore 管理的集群、Iceberg External Cataog 可以连接到 Iceberg 集群等。

用户可以使用 `SWITCH`语句切换不同的 Catalog，也可以通过全限定名方便的进行**跨数据源的联邦查询**，如：

```
SELECT * FROM hive.db1.tbl1 a JOIN iceberg.db2.tbl2 b
ON a.k1 = b.k1;
```

相关文档：https://doris.apache.org/zh-CN/docs/dev/lakehouse/multi-catalog

### 可扩展的元数据连接框架

基于新的元数据层级，用户可以通过 `CREATE CATALOG`语句方便的添加新的数据源：

```
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.21.0.1:7004',
);
```

在数据湖场景下，目前 Doris 支持的元数据服务包括：

-   Hive Metastore 兼容的元数据服务
-   Aliyun Data Lake Formation
-   AWS Glue

同时，开发者也可以自行扩展 External Catalog，只需要实现对应的访问接口，即可在 Doris 中快速接入新的元数据服务。

### **高效的元数据访问**

元数据存储在外部数据源中，而对外部数据源的访问受到网络、数据源资源等限制，性能和可靠性是不可控的。所以 Doris 需要提供高效、可靠的元数据服务以保证线上服务的稳定运行，同时 Doris 也需要实时感知元数据的变更，提升数据访问的实时性。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1e52775d83c64e63bde14cb22fb23b5d~tplv-k3u1fbpfcp-zoom-1.image)

Doris 通过内存中的**元数据缓存**提供高效的元数据服务。元数据缓存包括**列信息缓存**，**分区缓存**，**文件缓存。** 通过元信息缓存，可以显著提升元数据访问性能并降低对外部元数据服务的请求压力，**使得Doris 可以应对数千张表，数十万分区场景下，毫秒级别的元数据查询响应。**

Doris 支持在 Catalog/Database/Table 级别，对元数据缓存进行手动刷新。同时，针对 Hive Metastore，Doris还支持通过监听 Hive Metastore Event 自动同步元数据，提供元数据秒级实时更新能力。

### **自定义鉴权服务**

外部数据源通常拥有自己的权限管理服务，而很多企业也会使用统一的权限管理系统（例如 Apache Ranger）来管理多套数据系统。Doris支持通过自定义鉴权插件对接企业内部已有的权限管理系统，从而可以低成本的接入现有业务，完成授权、审计、数据加密等操作。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d065f96d56e44af380b75a6636706070~tplv-k3u1fbpfcp-zoom-1.image)

具体实现上，用户可以基于 Doris 的 AccessController 接口实现插件对接相应的权限管理系统，并在创建 Catalog 时，指定对应的鉴权插件。通过这种机制，所有通过 Doris 对外部数据源的访问，都将统一使用自定义的插件完成鉴权、审计等操作。

## 数据访问

外部数据源的数据访问，主要集中在对存储系统的访问支持上。在数据湖场景下，主要是对 HDFS 以及各种 S3 兼容的对象存储的支持。目前 Apache Doris 支持的存储系统如下，并且仍在不断增加中：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f66b6569b6c349fbbc1b1ccebb8854ca~tplv-k3u1fbpfcp-zoom-1.image)

# 性能优化

在实现数据源的连接和访问后，下一个问题是我们如何结合 Apache Doris 自身优异的查询性能以及各类存储系统的特性，进行针对性的查询性能优化，这也是在 构建 Lakehouse 过程中最需要解决的问题和权衡的因素。在具体实现过程中，Apache Doris 分别在**数据读取、执行引擎、优化器**方面进行了诸多优化。

## 数据读取

湖上数据通常存储在远端存储系统上，相较于本地存储，在数据的访问延迟、并发能力、IO 带宽上天然存在一定劣势。因此，在数据读取上，Apache Doris 从减少远端读取频率，降低读取量等方面出发进行了细致的优化。

### Native File Format Reader

Parquet 和 ORC 是最常见的开放数据格式，这些数据格式本身提供了包括索引、编码、统计信息在内的多种特性，如何针对格式特性来提升文件读取效率是性能优化的关键一步。在早期的实现中，Apache Doris 是通过 Apache Arrow 来读取 Parquet/ORC 数据文件的，但这种方式存在以下问题：

1.  **数据格式转换的开销**：Arrow Reader 需要先将文件读取成 Arrow 的内存格式，再转换到 Doris 自己的内存格式，两次数据转换带来额外的开销。
1.  **无法支持高级文件格式特性**。如不支持 Parquet 的 Page Index，不支持 Bloom Fitler，无法实现谓词下推、延迟物化等功能。

基于以上问题，我们对 Flile reader 进行了重构，实现了全新的 Native File Format Reader。这里我们以 Parquet Reader 为例，介绍 Doris 的文件格式读取方面所做的优化：

1.  **减少格式转换**。新的 File Reader 直接将文件格式转换成 Doris 的内存格式，并可以直接利用字典编码等功能转换到对应的更高性能的内存格式，以提升数据转换和处理的效率。
1.  **细粒度的智能索引**。支持了 Parquet 的 Page Index，可以利用 Page 级别的智能索引对 Page 进行过滤。相比之前只能在 Row Group 级别过滤，Page Index 过滤粒度更细、过滤效果更好。
1.  **谓词下推和延迟物化**。延迟物化的基本逻辑是先读取有过滤条件的列，再使用过滤后的行号读取其他列。这种方式能显著降低文件的读取量。这一点在远程文件读取场景下尤为重要，可以最大限度减少不必要的数据读取。
1.  **数据预读。** 将多次文件读取合并成一次，充分利用远端存储高吞吐、低并发的特性，提高数据的总体吞吐效率。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a5faaee5c7804020933e3a874d8fd32e~tplv-k3u1fbpfcp-zoom-1.image)

### File Cache

利用本地高性能磁盘对远端存储系统中的文件进行本地缓存，能最大限度的减少远程数据读取的开销，同时可以提供接近 Doris 内部表数据的访问性能。在本地文件缓存方面 Doris 进行了如下优化：

1.  **文件块缓存（Block Cache）** 。支持对远端文件进行 Block 级别的缓存。Block 的大小会根据读取请求自动调整，从 4KB 到 4MB 不等。Block 级别的缓存能有效减少缓存导致的读写放大问题，优化缓存冷启动场景下的数据读取延迟。
1.  **缓存一致性哈希**。通过一致性哈希算法对缓存位置和数据扫描任务进行管理和调度，充分利用已缓存的数据提供服务，并避免节点上下线导致缓存大面积失效的问题，提升缓存命中率和查询服务的稳定性。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7349ab4c773d495aa2b91334a4a28181~tplv-k3u1fbpfcp-zoom-1.image)

通过 Flie Cache，在命中缓存的情况下，Apache Doris 可以提供和本地表一致的查询性能。

## 执行引擎

在执行引擎层面，我们希望能够完全复用 Apache Doris 的向量化执行引擎以及各类执行层面的算子优化，为数据湖提供极速的查询体验。因此，Apache Doris 对数据扫描（Scan）节点进行了重构，使得每一种新的数据源的接入，开发者只需要关注数据源本身的访问逻辑，无需重复地开发通用功能。

1.  **通用查询能力的分层**

包括内表在内的所有数据查询，都会使用相同的 Join、Sort、Agg 等算子。唯一不同在于数据源的访问方式上，例如对本地内部格式数据的读取，或存储在 S3 上的 Parquet 格式数据的读取。因此 Doris 将不同数据源的查询逻辑差异下推到最底层的 Scan 节点上。Scan 节点之上，所有查询逻辑统一，Scan 节点之下，由具体的实现类负责不同数据源的访问逻辑。

2. **Scan 算子的通用框架**

对于 Scan 节点，不同数据源也有很多共性的方面，如子任务的拆分逻辑、子任务的调度、IO 的调度、谓词下推以及 Runtime Filter 的处理等。因此我们也对这一部分架构进行了重构。首先，将共性部分都以接口的形式对外暴露，如子任务的拆分、下推谓词的处理等；其次，对子任务实现了统一的调度管理逻辑，可以由统一的调度器管理整个节点 Scan 任务的执行。调度器拥有节点全局的信息，可以方便的实现更细粒度的Scan 任务调度策略。在这样的统一的数据查询框架下，**大约 1 人周就可以完成一种新数据源接入**。
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8879785df1ff4069a3fb6413c372a04b~tplv-k3u1fbpfcp-zoom-1.image)

## 查询优化器

查询优化器层面的优化集中在**统计信息收集**和**代价模型的推导**方面。

Apache Doris 支持对不同数据源的统计信息收集，如 Hive Metastore、Iceberg Metafile、Hudi MetaTable 中存储的统计信息等。同时在代价模型推导方面，我们也针对外部数据源的特性做了细致的调整。基于这些优化，Doris 可以为复杂的外表查询提供更优的查询规划。

## 性能对比

以上优先项，我们分别在**宽表场景**（Clickbench）和**多表关联场景**（TPC-H）下与 Presto/Trino 进行了 Hive 数据集的查询性能对比。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/12724f561f4f42bcbb8b2e1b56e18e81~tplv-k3u1fbpfcp-zoom-1.image)

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e87d52832eb343a09a0e091a5efe7043~tplv-k3u1fbpfcp-zoom-1.image)

可以看到，在相同计算资源和数据集下，无论是宽表场景或多表关联场景，绝大多数 SQL Apache Doris 的查询耗时都是大幅低于 Presto/Trino **，整体性能** **相比** **Presto/** **Trino 有 3-10 倍的提升**。

# 负载管理与弹性计算

对外部数据源的查询并不依赖 Doris 的数据存储能力，这也为 Doris 实现弹性的无状态计算节点成为可能。在即将发布的 2.0 版本中，Apache Doris 还实现了弹性计算节点功能（Elastic Compute Node），可以专门用于支持外部数据源的查询负载。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a91244140a5e43bfa32d7a91f1af62c6~tplv-k3u1fbpfcp-zoom-1.image)

由于计算节点是无状态的，因此我们可以对这类节点进行快速扩缩容，以灵活地应对峰谷期的查询负载，在查询性能与成本消耗之间取得更好的平衡。

同时，Doris 也针对 k8s 场景下的集群管理和节点调度进行了优化，Master 节点可以自动管理弹性计算节点的上下线，方便业务在云原生场景、混合云场景下都能便捷的管理集群负载。

# 案例实践

随着以上功能的完善与性能的提升，Apache Doris 已经被多家社区用户应用于数据湖分析，在真实业务中发挥着重要的作用，在此以某金融企业的风控场景为例。

金融风控场景往往对数据的实时性有着更高的要求，早期基于 Greenplum 和 CDH 搭建的风控数据集市已经无法满足其高时效性的需求，T+1 的数据生产模式成为业务迅速发展的掣肘，因此该企业于 2022 年引入 Apache Doris 并改造了整个数据生产和应用流程，实现对 Elasticsearch、Greenplum 以及 Hive 的联邦分析，整体效果包括：

-   只需创建一个 Hive Catalog 即可对现存的数万张 Hive 表进行查询分析，查询性能得到极大幅度提升；
-   利用 Elasticsearch Catalog 实现对 ES 实时数据的联邦分析，数据时效性从过去的分钟级提升至秒级甚至毫秒级，满足了风控策略的实时性要求；
-   将日常跑批与统计分析进行解耦，降低资源消耗的同时使系统稳定性得到进一步增强。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/22a00c256dbd4e1d8a95fb11a3ebcad8~tplv-k3u1fbpfcp-zoom-1.image)

# 未来规划

后续 Apache Doris 将持续在 Lakehouse 方向进行迭代和升级，下一步的工作将围绕在**更丰富的数据源支持**、**数据集成**和**资源隔离与调度**等方面：

## 更丰富的数据源支持

随着数据湖在各种业务场景中的不断落地，数据湖本身的功能也在不断迭代以满足越来越多样的业务需求。Doris也将和各个开源社区紧密合作，提供更完善的数据湖分析支持。

-   Hudi Merge-On-Read 表的 Incremental Query 支持
-   利用 Iceberg/Hudi 丰富的索引功能，结合查询优化器提供更低延迟的分析性能。
-   支持包括 Delta Lake、Flink Table Store 等更多数据湖格式。

## 数据集成

具体到功能层面，数据集成可以分为数据的**读取**和**写回**两部分。

**数据读取方面**，Doris 将进一步整合数据湖的数据访问特性，包括：

-   数据湖 CDC 的接入以及增量物化视图的支持，为用户提供近实时的数据视图。
-   支持 Git-Like 的数据访问模式，通过多版本、Branch 等机制，在数据安全、数据质量等方面为用户提供更便捷的数据管理模式。

**数据写回功能的支持**，帮助 Doris 进一步完善统一数据分析网关的生态闭环。用户可以使用 Doris 作为统一数据管理入口，管理各个数据源中的数据，包括加工后数据的写回、数据导出等，对业务提供统一的数据视图。

## 资源隔离与调度

随着越来越多数据源的接入，Doris 也在逐步承接不同的工作负载，比如在提供低延迟的在线服务的同时，对 Hive 中 T-1 的数据进行批量处理。所以同集群内的资源隔离会愈发重要。

Doris 会持续优化弹性计算节点在不同场景下的调度管理逻辑，同时会支持更细粒度的节点内资源隔离，如 CPU、IO、内存等，帮助 Doris 支持多样且稳定的工作负载。

# 加入我们

目前社区已成立 Lakehouse SIG（湖仓兴趣小组），汇集了来自多家企业的开发者，旨在共同打造 Apache Doris 的 Lakehouse 场景支持，欢迎感兴趣的同学加入我们。

**# 相关链接：**

**SelectDB 官网**：

https://selectdb.com 

**Apache Doris 官网**：

http://doris.apache.org

**Apache Doris Github**：

https://github.com/apache/doris
