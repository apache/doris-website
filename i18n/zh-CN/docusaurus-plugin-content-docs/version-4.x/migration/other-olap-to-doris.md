---
{
    "title": "其他 OLAP 系统迁移到 Doris",
    "language": "zh-CN",
    "description": "从 ClickHouse、Greenplum 及数据湖选择迁移路线与校验方法。"
}
---

ClickHouse、Greenplum 和数据湖表可以通过相应 Catalog 批量读入 Doris。先定义快照、更新和聚合语义，再选择目标表模型；源系统的存储引擎没有自动、完整的 Doris 等价物。

## 路线与前提条件

| 来源 | 连接与参数参考 | 迁移前检查 |
| --- | --- | --- |
| ClickHouse | [ClickHouse JDBC Catalog](../lakehouse/catalogs/jdbc-clickhouse-catalog.md) | 驱动、无符号整数、日期时间及复杂类型映射 |
| Greenplum | [PostgreSQL JDBC Catalog](../lakehouse/catalogs/jdbc-pg-catalog.md) | PostgreSQL 兼容驱动、实际元数据及分布式导出一致性 |
| Hive | [Hive Catalog](../lakehouse/catalogs/hive-catalog.mdx) | Metastore、文件存储、认证及分区 |
| Iceberg | [Iceberg Catalog](../lakehouse/catalogs/iceberg-catalog.mdx) | 元数据服务、存储权限及一致快照 |
| Hudi | [Hudi Catalog](../lakehouse/catalogs/hudi-catalog.md) | 表类型、可见视图、底层文件及查询限制 |

所有 FE/BE 都必须能访问相应服务、驱动和存储。按对应参考配置 Catalog，用具备读外表及建库建表、写目标表权限的 Doris 账户执行迁移。

## ClickHouse {#clickhouse}

使用对应 JDBC Catalog 和显式列列表执行 `INSERT INTO ... SELECT`。先运行 `DESC`，不要把目标设计建议当作 JDBC 的实际类型映射。例如，ClickHouse `FixedString` 的 Catalog 映射不是直接承诺为 CHAR，Map/Tuple 等复杂类型能否读取要按具体驱动和版本测试。

`ReplacingMergeTree`、`CollapsingMergeTree` 和聚合状态表需要确定最终可见数据、版本列、删除标记及合并规则。Doris Unique Key 不能自动复现这些引擎的全部语义。迁移 SQL 时还要测试 NULL、并列最大/最小值、数组展开和 JSON 字符串提取的差异。

## Greenplum {#greenplum}

按 [PostgreSQL 迁移](./postgresql-to-doris.md) 的批量流程准备 Catalog、目标表和校验，确认实际 Greenplum 类型映射。大表使用并行导出或分批 SQL 时，应确保所有分片来自同一个一致性视图；工具并行度本身不提供跨表快照保证。

## 数据湖 {#data-lake}

使用各自的 Hive、Iceberg、Hudi Catalog 查询源表。对于 Iceberg，应在迁移期间固定需要读取的快照；对于 Hudi，应先确认读取的是哪种视图及该版本支持的表类型。创建 Catalog 只提供外部访问，不会创建 Doris 数据副本。

## 基本用法

假设已按上述参考建立 `source_catalog`，源表 `analytics.migration_demo` 含有 `id BIGINT` 和 `value DECIMAL(12,2)` 两列，且源快照在迁移期间固定。先用外表 `DESC` 确认这两个类型，然后在 Doris 执行：

```sql
CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.olap_demo (
    id BIGINT,
    `value` DECIMAL(12,2)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.olap_demo (id, `value`)
SELECT id, `value` FROM source_catalog.analytics.migration_demo;

SELECT COUNT(*), SUM(`value`) FROM source_catalog.analytics.migration_demo;
SELECT COUNT(*), SUM(`value`) FROM migration_target.olap_demo;
```

预期结果：空目标表收到源快照中的全部两列数据，两条校验查询的行数和数值总和相等。单副本、单分桶仅供演示；实际环境按资源与可靠性要求调整。完整、固定输入的示例见 [MySQL](./mysql-to-doris.md) 或 [PostgreSQL](./postgresql-to-doris.md) 页面。

## 其他导入方式

无法直连源系统时，可以导出受支持的文件并通过 [S3 Load](../data-operate/import/data-source/amazon-s3.md) 或 [Broker Load](../data-operate/import/import-way/broker-load-manual.md) 导入。确认导出格式、编码、NULL 表示、精度和时区后再批量执行。

也可使用 [Spark Connector](../connection-integration/data-integration/spark-doris-connector.md) 或 [Flink Connector](../connection-integration/data-integration/flink-doris-connector.md)；具体批处理或流处理能力、依赖版本及语义以各 Connector 参考为准。

## 错误处理与建议

先验证小范围数据，再扩大批量和并发。对于不支持的类型，显式转换并检查是否丢失精度，不要直接跳过。重复执行 Duplicate Key 目标的 INSERT 会追加重复行；分批恢复前应核对已完成范围。切换前完成 [迁移概览](./overview.md) 中的跨库校验，并保留源数据与回退路径。
