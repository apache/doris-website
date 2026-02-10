---
{
    "title": "迁移概述",
    "language": "zh-CN",
    "description": "从各种数据库和数据系统迁移数据到 Apache Doris 的指南"
}
---

Apache Doris 提供多种方法从各种源系统迁移数据。本指南帮助您根据源系统和需求选择最佳的迁移方式。

## 迁移路径

| 源系统 | 迁移方法 | 实时同步 | 全量迁移 | 增量同步 |
|--------|---------|---------|---------|---------|
| [PostgreSQL](./postgresql-to-doris.md) | JDBC Catalog / Flink CDC | 支持 | 支持 | 支持 |
| [MySQL](./mysql-to-doris.md) | Flink CDC / JDBC Catalog | 支持 | 支持 | 支持 |
| [Elasticsearch](./elasticsearch-to-doris.md) | ES Catalog | 不支持 | 支持 | 手动 |
| [ClickHouse](./other-olap-to-doris.md#clickhouse) | JDBC Catalog | 不支持 | 支持 | 手动 |
| [Greenplum](./other-olap-to-doris.md#greenplum) | JDBC Catalog | 不支持 | 支持 | 手动 |
| [Hive/Iceberg/Hudi](./other-olap-to-doris.md#data-lake) | Multi-Catalog | 不支持 | 支持 | 支持 |

## 选择迁移方法

### 基于 Catalog 的迁移

Doris 的 [Multi-Catalog](../lakehouse/lakehouse-overview.md) 功能允许您直接查询外部数据源而无需数据移动。此方法适用于：

- **初步探索**：在决定迁移策略之前查询源数据
- **混合查询**：跨 Doris 和外部源进行 JOIN 查询
- **增量迁移**：在保持源可访问的同时逐步迁移数据

### Flink CDC（实时同步）

[Flink CDC](../ecosystem/flink-doris-connector.md) 适用于：

- **实时数据同步**：实时捕获变更
- **全库迁移**：自动建表同步整个数据库
- **零停机迁移**：在迁移过程中保持源和 Doris 同步

### 导出-导入方法

对于直接连接受限的场景：

1. 从源系统导出数据到文件（CSV、Parquet、JSON）
2. 将文件存储到对象存储（S3、GCS、HDFS）
3. 使用 [S3 Load](../data-operate/import/data-source/amazon-s3.md) 或 [Broker Load](../data-operate/import/import-way/broker-load-manual.md) 加载到 Doris

## 迁移规划原则

迁移前，请考虑以下事项：

1. **数据量评估**
   - 总数据大小和行数
   - 每日/每小时数据增长率
   - 历史数据保留要求

2. **Schema 设计**
   - 选择合适的[数据模型](../table-design/data-model/overview.md)（Duplicate、Unique、Aggregate）
   - 规划[分区](../table-design/data-partitioning/data-distribution.md)策略
   - 定义[分桶](../table-design/data-partitioning/data-bucketing.md)键

3. **数据类型映射**
   - 检查类型兼容性（参见各迁移指南的具体映射）
   - 处理特殊类型（数组、JSON、带时区的时间戳）

4. **性能要求**
   - 查询延迟预期
   - 并发查询负载
   - 数据新鲜度要求

5. **迁移窗口**
   - 可接受的停机时间（如果有）
   - 同步与异步迁移需求

## 最佳实践

- **从试点表开始**：在迁移整个数据库之前，先用一个代表性的表进行测试，验证 Schema 设计、类型映射和数据正确性。
- **批量大规模迁移**：对于数十亿行的表，分批迁移（例如按日期范围），以管理资源使用并在批次之间进行验证。
- **监控迁移进度**：使用 `SHOW LOAD` 跟踪活动和已完成的加载任务。
- **迁移后验证**：比较源和目标的行数、抽查记录、验证数据类型。

## 下一步

选择您的源系统查看详细的迁移说明：

- [PostgreSQL 迁移到 Doris](./postgresql-to-doris.md)
- [MySQL 迁移到 Doris](./mysql-to-doris.md)
- [Elasticsearch 迁移到 Doris](./elasticsearch-to-doris.md)
- [其他 OLAP 系统迁移到 Doris](./other-olap-to-doris.md)
