---
{
    "title": "MySQL Schema Change 同步",
    "language": "zh-CN",
    "sidebar_label": "Schema Change 同步",
    "description": "介绍 MySQL CDC 自动建表同步支持的 Schema Change 类型及其同步行为。",
    "keywords": [
        "MySQL Schema Change",
        "MySQL CDC",
        "自动建表同步",
        "持续导入",
        "Streaming Job",
        "新增列",
        "删除列"
    ]
}
---

<!-- 知识类型: 概念说明 -->
<!-- 适用场景: MySQL 自动建表同步期间的上游表结构变更 -->

MySQL Schema Change 同步用于在持续导入期间，将上游 MySQL 表的列结构变更自动应用到 Doris 目标表。该能力仅适用于 [MySQL CDC 自动建表同步](./continuous-load-mysql-database.md)，不适用于 [MySQL CDC SQL 映射同步](./continuous-load-mysql-table.md)。

## 支持的 Schema Change

| MySQL 操作 | Doris 行为 |
| --- | --- |
| `ADD COLUMN` | 新增同名列，类型遵循 [MySQL 数据类型映射](./data-type-mapping-mysql.md)，并复制列注释。不复制 DEFAULT 和 `NOT NULL` 约束，也不回填历史数据；后续数据使用 MySQL 写入 Binlog 的实际值。 |
| `DROP COLUMN` | 删除同名列。 |

## 注意事项

- 如果新增列已存在或待删除列不存在，Doris 会跳过对应操作，避免作业因重试失败。
- `FIRST` 和 `AFTER` 指定的列位置不会同步到 Doris。新增列会追加到 Doris 表的现有列之后。
- `CHANGE COLUMN`、`MODIFY COLUMN`、`RENAME COLUMN`、DEFAULT 变更以及 `NULL` / `NOT NULL` 约束变更均不会自动同步。执行这些操作前，需要暂停持续导入作业并手动修改 Doris 目标表，确认两端结构兼容后再恢复作业。
- 主键、索引、分区、表名以及其他表级结构变更不会自动同步。

## 相关文档

- [MySQL CDC 自动建表同步](./continuous-load-mysql-database.md)
- [MySQL 数据类型映射](./data-type-mapping-mysql.md)
- [持续导入概览](./continuous-load-overview.md)
