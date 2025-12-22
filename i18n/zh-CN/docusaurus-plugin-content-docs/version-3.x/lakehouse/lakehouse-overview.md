---
{
    "title": "湖仓一体概述",
    "language": "zh-CN",
    "description": "湖仓一体是将数据湖和数据仓库的优势相结合的现代化大数据解决方案。其融合了数据湖的低成本、高扩展性与数据仓库的高性能、强数据治理能力，从而实现对大数据时代各类数据的高效、安全、质量可控的存储和处理分析。同时通过标准化的数据格式和元数据管理，统一了实时、历史数据，批处理和流处理，"
}
---

**湖仓一体是将数据湖和数据仓库的优势相结合的现代化大数据解决方案**。其融合了数据湖的低成本、高扩展性与数据仓库的高性能、强数据治理能力，从而实现对大数据时代各类数据的高效、安全、质量可控的存储和处理分析。同时通过标准化的数据格式和元数据管理，统一了实时、历史数据，批处理和流处理，正在逐步成为企业大数据解决方案新的标准。

## Doris 湖仓一体解决方案

Doris 通过可扩展的连接器框架、存算分离架构、高性能的数据处理引擎和数据生态开放性，为用户提供了优秀的湖仓一体解决方案。

![doris-lakehouse-arch](/images/Lakehouse/lakehouse-arch-1.jpeg)

### 灵活的数据接入

Doris 通过可扩展的连接器框架，支持主流数据系统和数据格式接入，并提供基于 SQL 的统一数据分析能力，用户能够在不移动现有数据的情况下，轻松实现跨平台的数据查询与分析。具体可参阅 [数据目录概述](./catalog-overview.md)

### 数据源连接器

无论是 Hive、Iceberg、Hudi、Paimon，还是支持 JDBC 协议的数据库系统，Doris 均能轻松连接并高效访问数据。

对于湖仓系统，Doris 可从元数据服务，如 Hive Metastore，AWS Glue、Unity Catalog 中获取数据表的结构和分布信息，进行合理的查询规划，并利用 MPP 架构进行分布式计算。

具体可参阅各数据目录文档，如 [Iceberg Catalog](./catalogs/iceberg-catalog)

#### 可扩展的连接器框架

Doris 提供良好的扩展性框架，帮助开发人员快速对接企业内部特有的数据源，实现数据快速互通。

Doris 定义了标准的数据目录（Catalog）、数据库（Database）、数据表（Table）三个层级，开发人员可以方便的映射到所需对接的数据源层级。Doris 同时提供标准的元数据服务和数据读取服务的接口，开发人员只需按照接口定义实现对应的访问逻辑，即可完成数据源的对接。

Doris 兼容 Trino Connector 插件，可直接将 Trino 插件包部署到 Doris 集群，经过少量配置即可访问对应的数据源。Doris 目前已经完成了 [Kudu](./catalogs/kudu-catalog.md)、[BigQuery](./catalogs/bigquery-catalog.md)、[Delta Lake](./catalogs/delta-lake-catalog.md) 等数据源的对接。也可以 [自行适配新的插件](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide)。

#### 便捷的跨源数据处理

Doris 支持在运行时直接创建多个数据源连接器，并使用 SQL 对这些数据源进行联邦查询。比如用户可以将 Hive 中的事实表数据与 MySQL 中的维度表数据进行关联查询：

```sql
SELECT h.id, m.name
FROM hive.db.hive_table h JOIN mysql.db.mysql_table m
ON h.id = m.id;
```

结合 Doris 内置的 [作业调度](../admin-manual/workload-management/job-scheduler.md) 能力，还可以创建定时任务，进一步简化系统复杂度。比如用户可以将上述查询的结果，设定为每小时执行一次的例行任务，并将每次的结果，写入一张 Iceberg 表：

```sql
CREATE JOB schedule_load
ON SCHEDULE EVERY 1 HOUR DO
INSERT INTO iceberg.db.ice_table
SELECT h.id, m.name
FROM hive.db.hive_table h JOIN mysql.db.mysql_table m
ON h.id = m.id;
```

### 高性能的数据处理

Doris 作为分析型数据仓库，在湖仓数据处理和计算方面做了大量优化，并提供了丰富的查询加速功能：

* 执行引擎

    Doris 执行引擎基于 MPP 执行框架和 Pipeline 数据处理模型，能够很好的在多机多核的分布式环境下快速处理海量数据。同时，得益于完全的向量化执行算子，在计算性能方面，Doris 在 TPC-DS 等标准评测数据集中处于领先地位。

* 查询优化器

    Doris 能通过查询优化器自动优化和处理复杂的 SQL 请求。查询优化器针对多表关联、聚合、排序、分页等多种复杂 SQL 算子进行了深度优化，充分利用代价模型和关系代数变化，自动获取较优或最优的逻辑执行计划和物理执行计划，极大降低用户编写 SQL 的难度，提升易用性和性能。

* 缓存加速与 IO 优化

    外部数据源的访问，通常是网络访问，因此存在延迟高、稳定性差等问题。Apache Doris 提供了丰富的缓存机制，并在缓存的类型、时效性、策略方面都做了大量的优化，充分利用内存和本地高速磁盘，提升热点数据的分析性能。同时，针对网络 IO 高吞吐、低 IOPS、高延迟的特性，Doris 也进行了针对性的优化，可以提供媲美本地数据的外部数据源访问性能。

* 物化视图与透明加速

    Doris 提供丰富的物化视图更新策略，支持全量和分区级别的增量刷新，以降低构建成本并提升时效性。除手动刷新外，Doris 还支持定时刷新和数据驱动刷新，进一步降低维护成本并提高数据一致性。物化视图还具备透明加速功能，查询优化器能够自动路由到合适的物化视图，实现无缝查询加速。此外，Doris 的物化视图采用高性能存储格式，通过列存、压缩和智能索引技术，提供高效的数据访问能力，能够作为数据缓存的替代方案，提升查询效率。

如下所示，在基于 Iceberg 表格式的 1TB 的 TPCDS 标准测试集上，Doris 执行 99 个查询的总体运行仅为 Trino 的 1/3。

![doris-tpcds](/images/Lakehouse/tpcds1000.jpeg)

实际用户场景中，Doris 在使用一半资源的情况下，相比 Presto 平均查询延迟降低了 20%，95 分位延迟更是降低 50%。在提升用户体验的同时，极大降低了资源成本。

![doris-performance](/images/Lakehouse/performance.jpeg)

### 便捷的业务迁移

在企业整合多个数据源并实现湖仓一体转型的过程中，迁移业务的 SQL 查询到 Doris 是一项挑战，因为不同系统的 SQL 方言在语法和函数支持上存在差异。若没有合适的迁移方案，业务侧可能需要进行大量改造以适应新系统的 SQL 语法。

为了解决这个问题，Doris 提供了 [SQL 方言转换服务](sql-convertor/sql-convertor-overview.md)，允许用户直接使用其他系统的 SQL 方言进行数据查询。转换服务会将这些 SQL 方言转换为 Doris SQL，极大降低了用户的迁移成本。目前，Doris 支持 Presto/Trino、Hive、PostgreSQL 和 Clickhouse 等常见查询引擎的 SQL 方言转换，在某些实际用户场景中，兼容率可达到 99% 以上。

### 现代化的部署架构

自 3.0 版本以来，Doris 支持面向云原生的 [存算分离架构](../compute-storage-decoupled/overview.md)。这一架构凭借低成本和高弹性的特点，能够有效提高资源利用率，实现计算和存储的独立扩展。

![compute-storage-decouple](/images/Lakehouse/compute-storage-decouple.png)

上图是 Doris 存算分离的系统架构，对计算与存储进行了解耦，计算节点不再存储主数据，底层共享存储层（HDFS 与对象存储）作为统一的数据主存储空间，并支持计算资源和存储资源独立扩缩容。存算分离架构为湖仓一体解决方案带来了显著的优势：

* **低成本存储**：储和计算资源可独立扩展，企业可以根据需要增加存储容量而不必增加计算资源。同时，通过使用云上的对象存储，企业可以享受更低的存储成本和更高的可用性，对于比例相对较低的热点数据，依然可以使用本地高速磁盘进行缓存。

* **唯一可信来源**：有数据都存储在统一的存储层中，同一份数据供不同的计算集群访问和处理，确保数据的一致性和完整性，也减少数据同步和重复存储的复杂性。

* **负载多样性**：以根据不同的工作负载需求动态调配计算资源，支持批处理、实时分析和机器学习等多种应用场景。通过分离存储和计算，企业可以更灵活地优化资源使用，确保在不同负载下的高效运行。

此外，在存算一体架构下，依然可以通过 [弹性计算节点](./compute-node.md) 在湖仓数据查询场景提供弹性计算能力。

### 开放性

Doris 不仅支持开放湖表格式的访问，其自身存储的数据同样拥有良好的开放性。Doris 提供了开放存储 API，并[基于 Arrow Flight SQL 协议实现了高速数据链路](../db-connect/arrow-flight-sql-connect.md)，具备 Arrow Flight 的速度优势以及 JDBC/ODBC 的易用性。基于该接口，用户可以使用 Python/Java/Spark/Flink 的 ABDC 客户端访问 Doris 中存储的数据。

与开放文件格式相比，开放存储 API 屏蔽了底层的文件格式的具体实现，Doris 可以通过自身存储格式中的高级特性，如丰富的索引机制来加速数据访问。同时，上层的计算引擎无需对底层存储格式的变更或新特性进行适配，所有支持的该协议的计算引擎都可以同步享受到新特性带来的收益。

## 湖仓一体最佳实践

Doris 在湖仓一体方案中，主要用于 **湖仓查询加速**、**多源联邦分析** 和 **湖仓数据处理**。

### 湖仓查询加速

在该场景中，Doris 作为 **计算引擎**，对湖仓中数据进行查询分析加速。

![query-acceleration](/images/Lakehouse/query-acceleration.jpeg)

#### 缓存加速

针对 Hive、Iceberg 等湖仓系统，用户可以配置本地磁盘缓存。本地磁盘缓存会自动将查询设计的数据文件存储在本地缓存目录中，并使用 LRU 策略管理缓存的汰换。具体可参阅 [数据缓存](./data-cache.md) 文档。

#### 物化视图与透明改写

Doris 支持对外部数据源创建物化视图。物化视图根据 SQL 定义语句，预先将计算结果存储为 Doris 内表格式。同时，Doris 的查询优化器支持基于 SPJG（SELECT-PROJECT-JOIN-GROUP-BY）模式的透明改写算法。该算法能够分析 SQL 的结构信息，自动寻找合适的物化视图进行透明改写，并选择最优的物化视图来响应查询 SQL。

该功能通过减少运行时的计算量，可显著提升查询性能。同时可以在业务无感知的情况下，通过透明改写访问到物化视图中的数据。具体可参阅 [物化视图](../query-acceleration/materialized-view/async-materialized-view/overview.md) 文档。

### 多源联邦分析

Doris 可以作为 **统一 SQL 查询引擎**，连接不同数据源进行联邦分析，解决数据孤岛。

![federation-query](/images/Lakehouse/federation-query.png)

用户可以在 Doris 中动态创建多个 Catalog 连接不同的数据源。并使用 SQL 语句对不同数据源中的数据进行任意关联查询。具体可参阅 [数据目录概述](catalog-overview.md)。

### 湖仓数据处理

在该场景中，**Doris 作为数据处理引擎**，对湖仓数据进行加工处理。

![data-management](/images/Lakehouse/data-management.jpeg)

#### 定时任务调度

Doris 通过引入 Job Scheduler 功能，可以实现高效灵活的任务调度，减少了对外部系统的依赖。结合数据源连接器，用户可以实现外部数据的定期加工入库。具体可参阅 [作业调度](../admin-manual/workload-management/job-scheduler.md)。

#### 数据分层加工

企业通常会使用数据湖存储原始数据，在此基础上进行数据分层加工，将不同层的数据开放给不同的业务需求方。Doris 的物化视图功能支持对外部数据源创建物化视图，并支持在基于物化视图在加工，降低了分层加工的系统复杂度，提升数据处理效率。

#### 数据写回

数据写回功能将 Doris 的湖仓数据处理能力形成闭环。户可以直接通过 Doris 在外部数据源中创建数据库、表，并写入数据。当前支持 JDBC、Hive 和 Iceberg 三类数据源，后续会增加更多的数据源支持。具体可以参阅对应数据源的文档。

