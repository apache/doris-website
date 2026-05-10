---
{
    "title": "Truncate 操作",
    "language": "zh-CN",
    "description": "Doris TRUNCATE 如何快速清空表或分区数据？本文详解语法参数、适用场景、使用约束、数据恢复与 DELETE 选型对比。",
    "keywords": [
        "Doris TRUNCATE",
        "清空表数据",
        "清空分区数据",
        "TRUNCATE TABLE",
        "TRUNCATE PARTITION",
        "FORCE 强制清空",
        "数据恢复 RECOVER"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 数据清理 / 测试环境重置 / 分区数据重建 -->

`TRUNCATE` 用于一次性清空指定表或分区中的全部数据，仅保留表结构与分区定义。相比 `DELETE`，它不会产生删除版本，因此不会影响后续查询性能，是大批量清理场景下的首选方式。

## 快速导航

- [何时选择 TRUNCATE](#何时选择-truncate)：典型适用场景
- [语法与参数](#语法与参数)：命令格式说明
- [使用示例](#使用示例)：常见操作示范
- [使用约束](#使用约束)：执行前必须知道的限制
- [数据恢复](#数据恢复)：误操作后的找回方式
- [TRUNCATE vs DELETE](#truncate-vs-delete)：选型对比
- [常见问题](#常见问题)：FAQ

## 何时选择 TRUNCATE

`TRUNCATE` 适合需要一次性清空大量数据的场景：

- **测试环境重置**：清空测试数据，准备重新导入
- **分区数据重建**：清空指定分区后重新写入修正数据
- **大批量数据清理**：相较 `DELETE`，无版本累积，不影响查询性能
- **历史数据归档后清理**：归档完成后清空原表或分区

## 语法与参数

### 命令格式

```sql
TRUNCATE TABLE [db.]tbl [PARTITION(p1, p2, ...)] [FORCE];
```

### 参数说明

| 参数            | 必选 | 说明                                                    |
| --------------- | ---- | ------------------------------------------------------- |
| `db.`           | 否   | 数据库名，省略时使用当前数据库                          |
| `tbl`           | 是   | 待清空的表名                                            |
| `PARTITION(..)` | 否   | 指定分区名列表，仅清空这些分区；省略时清空整张表        |
| `FORCE`         | 否   | 直接物理删除数据，**不可通过 RECOVER 恢复**，请谨慎使用 |

## 使用示例

### 1. 清空整张表

清空 `example_db` 下 `tbl` 表的所有数据：

```sql
TRUNCATE TABLE example_db.tbl;
```

### 2. 清空指定分区

仅清空 `tbl` 表的 `p1` 与 `p2` 分区：

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```

### 3. 强制清空（不可恢复）

直接物理删除 `example_db.tbl` 的数据，跳过回收站：

```sql
TRUNCATE TABLE example_db.tbl FORCE;
```

:::caution
使用 `FORCE` 后无法通过 `RECOVER` 找回数据，请确认无误后再执行。
:::

## 使用约束

执行 `TRUNCATE` 前请确认以下条件：

- **仅清数据，保留结构**：表结构与分区定义保留，仅清空数据
- **不支持过滤条件**：只能整体清空表或指定分区，无法附加 `WHERE` 条件
- **表状态必须为 NORMAL**：正在执行 `SCHEMA CHANGE` 的表无法 TRUNCATE
- **影响进行中的导入**：可能导致正在执行的导入任务失败，建议在导入空闲期执行
- **默认可恢复**：未使用 `FORCE` 时，可在保留期内通过 [RECOVER](../../sql-manual/sql-statements/recycle/RECOVER) 恢复

## 数据恢复

执行 `TRUNCATE` 时若未指定 `FORCE`，被清空的数据会进入回收站，可在保留期内恢复：

```sql
RECOVER TABLE [db_name.]table_name;
```

详见 [RECOVER 语句说明](../../sql-manual/sql-statements/recycle/RECOVER)。

:::tip
回收站保留时长由 FE 配置项 `catalog_trash_expire_second` 控制，过期数据将被彻底清理。
:::

## TRUNCATE vs DELETE

两者都可用于删除数据，但适用场景差异明显：

| 对比项         | TRUNCATE                          | DELETE                     |
| -------------- | --------------------------------- | -------------------------- |
| 删除粒度       | 整张表或整个分区                  | 行级，可附加 `WHERE` 条件  |
| 是否支持过滤   | 不支持                            | 支持                       |
| 查询性能影响   | 不影响                            | 产生删除版本，影响查询性能 |
| 执行速度       | 极快（元数据级操作）              | 与命中行数相关             |
| 默认是否可恢复 | 可通过 `RECOVER` 恢复（非 FORCE） | 不可直接恢复               |
| 典型场景       | 大批量清空、分区重建              | 精确删除少量数据           |

**选型建议**：

- 需要清空整表或整个分区，优先使用 `TRUNCATE`
- 需要按条件删除部分数据，使用 `DELETE`

## 常见问题

### TRUNCATE 会删除表结构吗？

不会。`TRUNCATE` 只清空数据，表结构、分区定义、索引等元信息均保留。

### TRUNCATE 后能否恢复数据？

- **未加 `FORCE`**：可通过 `RECOVER` 在保留期内恢复
- **加了 `FORCE`**：数据被物理删除，无法恢复

### 表正在做 SCHEMA CHANGE 时能 TRUNCATE 吗？

不能。表状态必须为 `NORMAL`，否则命令会报错。请等待 SCHEMA CHANGE 完成后再执行。

### TRUNCATE 会影响正在进行的导入任务吗？

可能会导致进行中的导入任务失败。建议在导入空闲期执行，或先暂停相关导入。

### TRUNCATE 与 DROP TABLE 有什么区别？

- `TRUNCATE`：保留表结构，仅清空数据
- `DROP TABLE`：删除表本身，包括结构与数据

### 能否只清空某个分区的部分数据？

不能。`TRUNCATE` 只能整体清空表或指定分区，不支持行级过滤。如需按条件删除，请使用 [DELETE](./delete-manual)。

## 相关文档

- [RECOVER 语句](../../sql-manual/sql-statements/recycle/RECOVER)：恢复被清空的数据
- [DELETE 操作](./delete-manual)：按条件删除数据
