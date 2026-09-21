---
{
    "title": "OceanBase Schema Change 同步",
    "language": "zh-CN",
    "sidebar_label": "Schema Change 同步",
    "description": "介绍 OceanBase CDC 自动建表同步支持的 Schema Change 类型、同步行为和限制。",
    "keywords": [
        "OceanBase Schema Change",
        "OceanBase CDC",
        "自动建表同步",
        "持续导入",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

<!-- 知识类型: 概念说明 -->
<!-- 适用场景: OceanBase 自动建表同步期间的上游表结构变更 -->

OceanBase Schema Change 同步用于在持续导入期间，将上游 OceanBase 表的列结构变更自动应用到 Doris 目标表。该能力仅适用于 [OceanBase CDC 自动建表同步](./continuous-load-oceanbase-database.md)。

:::caution 实验性功能

OceanBase Schema Change 同步自 Doris 4.1.4 起作为实验性功能提供，仅支持 MySQL 兼容模式。

:::

OceanBase 复用 MySQL CDC 的 Schema Change 处理逻辑，支持范围和同步行为与 MySQL 一致。

## 支持的 Schema Change

| OceanBase 操作 | Doris 行为 |
| --- | --- |
| `ADD COLUMN` | 新增同名列，类型遵循 [OceanBase 数据类型映射](./data-type-mapping-oceanbase.md)，并复制列注释。不复制 DEFAULT 和 `NOT NULL` 约束，也不回填历史数据；后续数据使用 OceanBase 写入 Binlog 的实际值。 |
| `DROP COLUMN` | 删除同名列。 |

## 注意事项

- 如果新增列已存在或待删除列不存在，Doris 会跳过对应操作，避免作业因重试失败。
- `FIRST` 和 `AFTER` 指定的列位置不会同步到 Doris；新增列会追加到 Doris 表现有列之后。
- `CHANGE COLUMN`、`MODIFY COLUMN`、`RENAME COLUMN`、DEFAULT 变更以及 `NULL` / `NOT NULL` 约束变更不会自动同步。
- 主键、索引、分区、表名以及其他表级结构变更不会自动同步。
- 执行不支持的结构变更前，应暂停持续导入作业，手动修改 Doris 目标表并确认两端结构兼容，然后恢复作业。
- 自动建表同步默认启用 Schema Change 同步，目前未提供通过 SQL 关闭该能力的配置参数。

## 示例

在 OceanBase 源表新增列：

```sql
ALTER TABLE source_db.users ADD COLUMN city VARCHAR(50);
INSERT INTO source_db.users VALUES (2, 'Alice', 'Hangzhou');
```

作业处理完增量数据后，Doris 目标表会增加 `city` 列：

```sql
DESC target_db.users;
```

```text
+-------+--------------+------+-------+---------+-------+
| Field | Type         | Null | Key   | Default | Extra |
+-------+--------------+------+-------+---------+-------+
| id    | int          | No   | true  | NULL    |       |
| name  | varchar(100) | Yes  | false | NULL    | NONE  |
| city  | varchar(50)  | Yes  | false | NULL    | NONE  |
+-------+--------------+------+-------+---------+-------+
```

## 相关文档

- [OceanBase CDC 自动建表同步](./continuous-load-oceanbase-database.md)
- [OceanBase 数据类型映射](./data-type-mapping-oceanbase.md)
- [持续导入概览](./continuous-load-overview.md)
