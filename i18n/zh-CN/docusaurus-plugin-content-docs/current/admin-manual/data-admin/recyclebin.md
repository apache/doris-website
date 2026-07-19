---
{
    "title": "从回收站恢复",
    "language": "zh-CN",
    "description": "通过 Doris 回收站机制，可恢复因误操作 DROP 删除的数据库、表或分区，避免数据丢失。本文介绍查询与恢复的完整操作。",
    "keywords": [
        "Doris 回收站",
        "数据恢复",
        "误删恢复",
        "RECOVER",
        "SHOW CATALOG RECYCLE BIN",
        "DROP DATABASE 恢复",
        "DROP TABLE 恢复",
        "DROP PARTITION 恢复",
        "DROP FORCE",
        "recycle bin",
        "data recovery",
        "数据库误删除",
        "分区恢复"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 数据库/表/分区误删除恢复 / 灾难恢复 -->

为了避免误操作造成的数据灾难，Doris 提供回收站机制，支持对意外删除的数据库、表和分区进行恢复。

执行 `DROP DATABASE/TABLE/PARTITION` 命令时，如果未带 `FORCE` 关键字，Doris 不会立即物理删除数据，而是将对应的数据库、表或分区移动到回收站。后续可以使用 `RECOVER` 命令将其还原，使其重新可见。

:::warning 注意
如果执行 `DROP ... FORCE`，数据会被立即物理删除，无法通过回收站恢复。
:::

## 适用场景

| 场景 | 是否可恢复 | 推荐操作 |
| --- | --- | --- |
| 误执行 `DROP DATABASE example_db` | 可恢复 | `RECOVER DATABASE example_db` |
| 误执行 `DROP TABLE example_db.example_tbl` | 可恢复 | `RECOVER TABLE example_db.example_tbl` |
| 误执行 `ALTER TABLE ... DROP PARTITION p1` | 可恢复 | `RECOVER PARTITION p1 FROM example_tbl` |
| 误执行 `DROP ... FORCE` | 不可恢复 | 需通过备份恢复 |

## 前置条件

- 当前用户对待恢复对象具备 `ALTER_PRIV` 等相应权限。
- 删除时使用的是不带 `FORCE` 的 `DROP` 命令。
- 回收站中的对象未被手动清理（参考 [DROP-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/DROP-CATALOG-RECYCLE-BIN)）。

## 恢复流程总览

1. 通过 `SHOW CATALOG RECYCLE BIN` 查询回收站中可恢复的对象。
2. 根据对象类型（DATABASE / TABLE / PARTITION）选择对应的 `RECOVER` 命令。
3. 执行恢复后，验证对象是否重新可见、数据是否完整。

## 查询回收站

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 恢复前确认回收站中是否存在目标对象 -->

执行恢复操作之前，先确认目标对象是否仍在回收站中。

```sql
SHOW CATALOG RECYCLE BIN [WHERE NAME [= "name" | LIKE "name_matcher"]];
```

参数说明：

| 参数 | 说明 |
| --- | --- |
| `NAME = "name"` | 按精确名称过滤回收站中的对象 |
| `NAME LIKE "name_matcher"` | 按通配符模糊匹配（支持 `%`、`_`） |

更详细的语法和最佳实践，请参阅 [SHOW-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN) 命令手册；也可以在 MySQL 客户端命令行中输入 `HELP SHOW CATALOG RECYCLE BIN` 获取更多帮助。

## 执行数据恢复

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 数据库/表/分区误删除后的数据还原 -->

根据待恢复对象的类型，选择以下命令之一。

### 恢复数据库

恢复名为 `example_db` 的数据库：

```sql
RECOVER DATABASE example_db;
```

### 恢复表

恢复 `example_db` 中名为 `example_tbl` 的表：

```sql
RECOVER TABLE example_db.example_tbl;
```

### 恢复分区

恢复 `example_tbl` 表中的分区 `p1`：

```sql
RECOVER PARTITION p1 FROM example_tbl;
```

更详细的 `RECOVER` 语法和最佳实践，请参阅 [RECOVER](../../sql-manual/sql-statements/recycle/RECOVER) 命令手册；也可以在 MySQL 客户端命令行中输入 `HELP RECOVER` 获取更多帮助。

## 常见问题

### Q: 执行 `RECOVER` 时报对象不存在怎么办？

删除时使用了 `DROP ... FORCE`，导致对象未进入回收站，无法通过回收站恢复。需从备份还原数据。

### Q: `SHOW CATALOG RECYCLE BIN` 查询不到目标对象怎么办？

对象已被 `DROP CATALOG RECYCLE BIN` 主动清理，无法恢复。需从备份还原数据。

### Q: 恢复时报权限错误怎么办？

当前用户缺少相应权限。由具备权限的用户授权或代为执行恢复操作。

### Q: 恢复后查询不到数据怎么办？

同名对象已被新建覆盖。先 `RENAME` 或删除新对象，再重新执行恢复。
