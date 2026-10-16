---
{
    "title": "OceanBase Schema Change 同步",
    "language": "zh-CN",
    "sidebar_label": "Schema Change 同步",
    "description": "介绍 OceanBase CDC 自动建表同步的 Schema Change 开关及支持范围，说明 evolve 与 ignore 的默认值和配置方式、检测到不支持变更后的暂停行为，以及检查目标表、手动恢复作业的步骤和限制。",
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

## 支持的 Schema Change

默认启用自动同步（`schema_change_behavior=evolve`），支持范围如下：

| OceanBase 变更 | Doris 行为 |
| --- | --- |
| 新增列（`ADD COLUMN`） | 自动新增同名列，类型遵循 [OceanBase 数据类型映射](./data-type-mapping-oceanbase.md)，并复制列注释。 |
| 删除列（`DROP COLUMN`） | 自动删除同名列。 |
| `CHANGE COLUMN`、`MODIFY COLUMN`、`RENAME COLUMN` | 暂停作业，需手动处理。通过这些操作修改默认值、可空性或注释也会暂停。 |
| 主键变化 | 暂停作业，需手动处理。 |
| 索引、分区、表名及其他表级操作 | 不同步；`TRUNCATE`、`DROP TABLE` 不会清空或删除 Doris 表。 |

新增列不复制默认值和非空约束，也不回填 Doris 中已有的数据。`FIRST` 和 `AFTER` 指定的列位置不同步，新增列追加到目标表末尾。

## 配置 Schema Change 行为

在 `FROM OCEANBASE (...)` 中设置 `schema_change_behavior`。该参数为可选字符串，取值不区分大小写，默认值为 `evolve`。

| 取值 | 行为与适用场景 |
| --- | --- |
| `evolve` | 由 Doris 自动同步支持的列变更。不支持的列或主键变更会使作业暂停，需按[恢复步骤](#不支持变更后的恢复)处理。 |
| `ignore` | 自行维护 Doris 表结构时使用。源端结构变化不会修改目标表，数据仍继续同步；结构不兼容导致的写入错误仍可能使作业失败或暂停。 |

创建作业时，将 `"schema_change_behavior" = "ignore"` 加入 `FROM OCEANBASE (...)` 即可关闭结构同步。已有作业需要先暂停，再通过 `ALTER JOB` 修改。

## 示例

### 关闭结构同步

以下示例沿用 [OceanBase 自动建表同步](./continuous-load-oceanbase-database.md) 中已创建的作业和目标库。执行前，请确认目标表能接收后续数据；使用自己的作业时，替换作业名和目标库名。

```sql
PAUSE JOB WHERE jobname = 'oceanbase_db_sync';
ALTER JOB oceanbase_db_sync
FROM OCEANBASE (
    "schema_change_behavior" = "ignore"
)
TO DATABASE target_db;
RESUME JOB WHERE jobname = 'oceanbase_db_sync';
```

作业恢复后继续同步数据，后续源端列变更不再自动修改 Doris 表。

将上述参数改为 `evolve` 可重新开启结构同步，但**不会补做 `ignore` 期间跳过的变更**。重新开启前，需先手动调整目标表，使其兼容当前源表结构。

### 验证新增列同步

假设作业已进入增量同步，使用 `evolve` 模式，且源表 `source_db.users` 包含 `id INT PRIMARY KEY` 和 `name VARCHAR(100)`，尚无 `city` 列。在 OceanBase 中执行（示例主键 `2` 应尚未使用）：

```sql
ALTER TABLE source_db.users ADD COLUMN city VARCHAR(50);
INSERT INTO source_db.users (id, name, city) VALUES (2, 'Alice', 'Hangzhou');
```

等待增量数据同步后，在 Doris 中查询：

```sql
SELECT id, name, city FROM target_db.users WHERE id = 2;
```

预期结果：目标表自动增加 `city` 列，并写入新数据。

```text
+----+-------+----------+
| id | name  | city     |
+----+-------+----------+
|  2 | Alice | Hangzhou |
+----+-------+----------+
```

## 不支持变更后的恢复

1. 在 Doris 中检查作业状态和错误：

   ```sql
   SELECT Name, Status, ErrorMsg
   FROM jobs("type" = "insert")
   WHERE Name = 'oceanbase_db_sync';
   ```

   如果 `Status` 为 `PAUSED`，且 `ErrorMsg` 包含 `[SCHEMA_CHANGE_UNSUPPORTED]`，说明需要手动处理结构变更。该错误不会触发自动恢复；详细原因可查看 CDC Client 日志。

2. 检查对应的 Doris 目标表，手动调整为兼容结构。变更后的源表中，所有未被 `exclude_columns` 排除的列都必须在目标表中存在，目标表可以保留额外列。恢复检查**只核对列名，不验证类型和主键是否兼容**，这两项需要自行确认。

   如果源端重命名了列，需准备新列名。作业可能重放最近已提交位点之后的数据，因此还可能需要保留旧列来接收变更前的数据，不能只重命名目标列。

3. 确认目标表兼容后，手动恢复：

   ```sql
   RESUME JOB WHERE jobname = 'oceanbase_db_sync';
   ```

   执行此命令表示接受本轮不支持的变更；即使目标表原本已兼容，也需要执行。缺少必要列时，作业会再次暂停。

4. 再次查询状态和错误，并检查目标表数据是否继续更新。仅恢复到 `RUNNING` 不代表后续写入一定成功。

本次确认有效至下一个同步任务成功提交，期间遇到的其他不支持变更也可能被一并接受，需一并确认目标表兼容性；若提交前 FE 重启，需要重新检查并恢复。切换为 `ignore` 也不能代替必要的目标表调整。

## 注意事项

- 新增列已存在或待删除列不存在时，会跳过对应操作，避免重试报错。
- `evolve` 模式下，同一个变更事件同时包含支持与不支持的操作时，会先暂停，不会只执行其中支持的部分。恢复前需按完整的变更后结构检查目标表。
- `exclude_columns` 排除的列不参与目标列 DDL 和对应的列级不支持检查，主键检查不受影响；重命名涉及未排除列时仍可能暂停。

## 相关文档

- [OceanBase CDC 自动建表同步](./continuous-load-oceanbase-database.md)
- [OceanBase 数据类型映射](./data-type-mapping-oceanbase.md)
- [持续导入概览](./continuous-load-overview.md)
