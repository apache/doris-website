---
{
    "title": "PostgreSQL Schema Change 同步",
    "language": "zh-CN",
    "sidebar_label": "Schema Change 同步",
    "description": "介绍 PostgreSQL CDC 自动建表同步支持的 Schema Change 类型及其同步行为。",
    "keywords": [
        "PostgreSQL Schema Change",
        "PostgreSQL CDC",
        "自动建表同步",
        "持续导入",
        "Streaming Job",
        "新增列",
        "删除列"
    ]
}
---

<!-- 知识类型: 概念说明 -->
<!-- 适用场景: PostgreSQL 自动建表同步期间的上游表结构变更 -->

PostgreSQL Schema Change 同步用于在持续导入期间，将上游 PostgreSQL 表的列结构变更自动应用到 Doris 目标表。该能力仅适用于 [PostgreSQL CDC 自动建表同步](./continuous-load-postgresql-database.md)，不适用于 [PostgreSQL CDC SQL 映射同步](./continuous-load-postgresql-table.md)。

:::tip

PostgreSQL Schema Change 同步自 Doris 4.1.0 起支持。

:::

## 支持的 Schema Change

| PostgreSQL 操作 | Doris 行为 |
| --- | --- |
| `ADD COLUMN` | 新增同名的 Nullable 列，类型遵循 [PostgreSQL 数据类型映射](./data-type-mapping-postgresql.md)。不复制 DEFAULT 和 `NOT NULL` 约束，也不回填历史数据；后续数据使用 PostgreSQL 写入 WAL 的实际值。 |
| `DROP COLUMN` | 删除同名列及其历史数据。 |

## 注意事项

- PostgreSQL Schema Change 不会因单独执行 DDL 立即传播。发生变更的表产生后续 INSERT、UPDATE 或 DELETE 后，Doris 才会检测并应用新的表结构。
- 全量同步期间不支持自动同步 Schema Change。请在全量同步完成并进入增量同步后，再执行上游表结构变更。
- 如果新增列已存在或待删除列不存在，Doris 会跳过对应操作，避免作业因重试失败。
- 如果一次表结构变更中同时包含新增列和删除列，Doris 会将其视为潜在的列重命名，不会自动修改目标表，以避免误删数据。
- 列重命名、列类型变更、DEFAULT 变更以及 `NULL` / `NOT NULL` 约束变更均不会自动同步。执行这些操作时，需要暂停持续导入作业并手动修改 Doris 目标表，确认两端结构兼容后再恢复作业。

## 相关文档

- [PostgreSQL CDC 自动建表同步](./continuous-load-postgresql-database.md)
- [PostgreSQL 数据类型映射](./data-type-mapping-postgresql.md)
- [持续导入概览](./continuous-load-overview.md)
