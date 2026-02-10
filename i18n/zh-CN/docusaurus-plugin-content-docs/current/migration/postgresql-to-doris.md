---
{
    "title": "PostgreSQL 迁移到 Doris",
    "language": "zh-CN",
    "description": "从 PostgreSQL 迁移数据到 Apache Doris 的完整指南"
}
---

本指南介绍如何将数据从 PostgreSQL 迁移到 Apache Doris。您可以根据实时同步需求、数据量和运维复杂度选择多种迁移方法。

## 注意事项

1. **Schema 设计**：迁移前，选择合适的 Doris [数据模型](../table-design/data-model/overview.md)并规划您的[分区](../table-design/data-partitioning/data-distribution.md)和[分桶](../table-design/data-partitioning/data-bucketing.md)策略。

2. **数据类型**：查看下面的类型映射表。某些 PostgreSQL 类型需要特殊处理（数组、带时区的时间戳、JSON）。

3. **主键**：PostgreSQL 的 serial/identity 列映射到 Doris 的 INT/BIGINT 类型。对于唯一约束，使用 Doris 的 UNIQUE KEY 模型。

4. **时区处理**：PostgreSQL `timestamptz` 以 UTC 存储时间戳并在读取时转换为会话时区。Doris `DATETIME` 不携带时区信息。迁移时显式转换时间戳，并确保 Doris BE 中 JVM 时区一致（`be.conf`）。

5. **数组处理**：PostgreSQL 数组映射到 Doris ARRAY 类型，但维度检测需要现有数据。如果无法确定数组维度，使用显式转换。

6. **JSON/JSONB**：PostgreSQL JSON/JSONB 映射到 Doris VARIANT 类型，支持灵活 Schema 和高效的 JSON 操作。

7. **大表迁移**：对于数亿行的表，按时间范围或 ID 范围分区迁移，同时运行多个 INSERT 语句，并监控 Doris BE 内存和磁盘使用情况。

## 数据类型映射

| PostgreSQL 类型 | Doris 类型 | 说明 |
|-----------------|------------|------|
| boolean | BOOLEAN | |
| smallint / int2 | SMALLINT | |
| integer / int4 | INT | |
| bigint / int8 | BIGINT | |
| decimal / numeric | DECIMAL(P,S) | 无精度的 Numeric 映射为 STRING |
| real / float4 | FLOAT | |
| double precision | DOUBLE | |
| smallserial | SMALLINT | |
| serial | INT | |
| bigserial | BIGINT | |
| char(n) | CHAR(N) | |
| varchar / text | STRING | |
| timestamp | DATETIME | |
| timestamptz | DATETIME | 转换为本地时区；参见上方时区处理 |
| date | DATE | |
| time | STRING | Doris 不支持 TIME 类型 |
| interval | STRING | |
| json / jsonb | VARIANT | 参见 [VARIANT 类型](../data-operate/import/complex-types/variant.md)，支持灵活 Schema |
| uuid | STRING | |
| bytea | STRING | |
| array | ARRAY | 参见上方数组处理 |
| inet / cidr / macaddr | STRING | |
| point / line / polygon | STRING | 几何类型存储为字符串 |

## 迁移选项

### 选项 1：JDBC Catalog（批量迁移）

[JDBC Catalog](../lakehouse/catalogs/jdbc-catalog.md) 提供从 Doris 直接访问 PostgreSQL 数据的能力。这是查询和迁移数据最简单的方法。

**前提条件**：PostgreSQL 11.x 或更高版本；[PostgreSQL JDBC 驱动](https://jdbc.postgresql.org/) 42.5.x 或更高版本；Doris FE/BE 节点与 PostgreSQL 之间的网络连接（端口 5432）。

### 选项 2：Flink CDC（实时同步）

Flink CDC 从 PostgreSQL WAL（预写日志）捕获变更并实时流式传输到 Doris。这适用于持续同步场景。

**前提条件**：启用逻辑复制的 PostgreSQL（`wal_level = logical`）；Flink 1.15+ 配合 Flink CDC 和 Flink Doris Connector；PostgreSQL 中的复制槽。

详细设置请参考 [Flink Doris Connector](../ecosystem/flink-doris-connector.md) 文档。

### 选项 3：Streaming Job（持续文件加载）

Doris 内置的 [Streaming Job](../data-operate/import/streaming-job.md)（`CREATE JOB ON STREAMING`）提供无需外部工具的持续文件加载能力。将 PostgreSQL 数据导出到 S3/对象存储，Streaming Job 会自动发现新文件并加载到 Doris。

此选项适用于：

- 通过文件导出管道进行持续增量迁移
- 偏好使用 Doris 原生功能而非 Flink 等外部工具的环境
- PostgreSQL 数据定期导出到对象存储的场景

**前提条件**：数据已导出到 S3 兼容的对象存储；Doris 2.1+ 并启用 Job Scheduler。

详细设置请参考 [Streaming Job](../data-operate/import/streaming-job.md) 和 [CREATE STREAMING JOB](../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) 文档。

### 选项 4：导出和加载

适用于网络隔离环境或无法直接连接的情况：

1. 从 PostgreSQL 导出数据到文件（CSV、Parquet）
2. 上传到对象存储（S3、HDFS）
3. 使用 [S3 Load](../data-operate/import/data-source/amazon-s3.md) 或 [Broker Load](../data-operate/import/import-way/broker-load-manual.md) 加载到 Doris

## 验证清单

迁移后，验证：

- 源和目标的行数匹配
- 样本记录相同
- NULL 值正确保留
- 数值精度保持
- 日期/时间值正确（检查时区）
- 数组和 JSON 字段可查询

## 下一步

- [Flink Doris Connector](../ecosystem/flink-doris-connector.md) - 详细的连接器文档
- [数据导入](../data-operate/import/load-manual.md) - 其他导入方法
- [数据模型](../table-design/data-model/overview.md) - 选择正确的表模型
