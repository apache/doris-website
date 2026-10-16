---
{
    "title": "迁移概览",
    "language": "zh-CN",
    "description": "选择迁移方式，设计目标表并验证迁移结果。"
}
---

Apache Doris 支持通过外部 Catalog、CDC 工具和文件导入迁移数据。迁移通常只转移表数据；源库的事务、索引、约束、存储过程、权限和 SQL 语义需要单独评估。先明确是一次性快照迁移，还是持续同步更新和删除，再选择路线。

## 迁移路线

| 来源 | 一次性或批量迁移 | 持续同步 |
| --- | --- | --- |
| [PostgreSQL](./postgresql-to-doris.md) | PostgreSQL JDBC Catalog + `INSERT INTO ... SELECT` | Flink CDC |
| [MySQL](./mysql-to-doris.md) | MySQL JDBC Catalog + `INSERT INTO ... SELECT` | Flink CDC |
| [Elasticsearch](./elasticsearch-to-doris.md) | ES Catalog + `INSERT INTO ... SELECT` | 单独设计增量捕获、更新和删除流程 |
| [ClickHouse / Greenplum](./other-olap-to-doris.md) | 对应 JDBC Catalog 或文件导入 | 按源系统另行设计 |
| [Hive / Iceberg / Hudi](./other-olap-to-doris.md#data-lake) | 对应数据湖 Catalog + `INSERT INTO ... SELECT` | 周期性批量任务或相应 Connector |

Catalog 使数据可以被查询，但创建 Catalog 本身不会把数据复制到 Doris 内部表。批量 `INSERT INTO ... SELECT` 不会自动持续捕获后续更新和删除。

## 基本流程

1. 确认每个 FE/BE 到源系统的网络连通性、驱动部署、源端读取权限及 Doris 建 Catalog、建表和写入权限。
2. 选定源表的稳定快照或停写窗口。跨表、分批 Catalog 查询不自动构成全局一致快照。
3. 使用 `DESC catalog.database.table` 检查实际映射，按 [数据模型](../table-design/data-model/intro.mdx) 设计目标表；不要直接照搬源库主键、引擎或索引。
4. 运行一张小表的完整迁移。MySQL 和 PostgreSQL 页面提供可复现的建表、导入和查询结果。
5. 按固定的键或时间边界分批导入，记录已完成的范围及 CDC 起始位点，验证后再切换读流量。

## 配置与类型

| 事项 | 必须确认的内容 |
| --- | --- |
| Catalog | 驱动、连接地址、身份认证及目录安全配置，详见 [JDBC Catalog](../lakehouse/catalogs/jdbc-catalog-overview.md) 或 [ES Catalog](../lakehouse/catalogs/es-catalog.md) |
| 目标表 | Key 模型、分区、分桶、副本数及更新顺序 |
| 类型映射 | 映射取决于导入方法、驱动和 Doris 版本；JDBC 映射不等同于 CDC 映射 |
| 时间与二进制 | 特别核查时区、微秒精度和字节保真；4.1.5 起部分 JDBC 映射发生变化，按所用版本的 Catalog 参考执行 |
| 增量同步 | 初始快照与日志位点的衔接、主键、重复写入、更新及删除 |

## 校验与切换

使用相同源快照和固定范围，比较源端与目标端的行数、主键去重数、NULL 数量、数值总和及极值。对时区时间、精确小数、二进制、数组和半结构化字段做逐值抽样；只比较行数不足以证明迁移正确。

持续同步还要插入、更新和删除测试记录，确认目标结果、延迟及任务重启后的行为。确认无遗漏后再切换应用读取，并保留源数据和回退路径。

## 错误处理与注意事项

- 重复执行批量 INSERT 可能重复写入，尤其是 Duplicate Key 表。恢复前先确定重放策略；Unique Key 也不会自动删除源端已经删除的行。
- 分批执行时源数据继续变化，会导致遗漏或重复。使用一致性快照、停写窗口或可靠的 CDC 衔接。
- 遇到不支持类型、字段大小写或精度差异，先检查外表 `DESC`，显式转换并重新校验；不要静默丢弃不兼容列。
- 同步 INSERT、异步 Load、Flink 和 Streaming Job 的状态入口不同，使用对应导入方式的监控文档，不能统一依赖 `SHOW LOAD`。

## 建议

先迁移有代表性的小表，再根据实际数据量、查询负载和存储资源决定分批大小与并发。切换前验证查询结果和更新语义，保留可重复执行的导入范围与校验记录。
