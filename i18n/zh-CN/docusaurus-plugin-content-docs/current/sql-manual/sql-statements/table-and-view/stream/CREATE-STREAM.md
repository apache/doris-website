---
{
    "title": "CREATE STREAM",
    "language": "zh-CN",
    "description": "该语句用于在一张开启了 Row Binlog 的内表上创建 Table Stream，用于增量消费表的变更。"
}
---

## 描述

该语句用于在一张开启了 Row Binlog 的内表上创建 Table Stream。Table Stream 记录基表每个分区的消费位点，通过 `SELECT ... FROM <stream>` 读取上次消费之后的变更，通过 `INSERT INTO ... SELECT ... FROM <stream>` 消费变更并推进位点。功能说明见 [Table Stream 基础](../../../../data-operate/incremental/table-stream)。

该功能自 5.0.0 版本起提供，目前处于实验阶段，需要在 FE 配置中开启 `enable_feature_binlog = true` 和 `enable_table_stream = true`。

## 语法

```sql
CREATE STREAM [IF NOT EXISTS] [<db_name>.]<stream_name>
ON TABLE [<db_name>.]<table_name>
[COMMENT '<comment>']
[PROPERTIES ("<key>" = "<value>" [, ...])]
```

## 必选参数

**1. `<stream_name>`**
> Stream 的标识符（即名称），在所在数据库中必须唯一，不能与表、视图重名。标识符要求与表名相同。

**2. `<table_name>`**
> 基表名称。基表必须是内表且已开启 Row Binlog（`"binlog.enable" = "true"`、`"binlog.format" = "ROW"`），可以与 Stream 位于不同的数据库。

## 可选参数

**1. `<db_name>`**
> Stream 或基表所在的数据库，未指定时为当前数据库。

**2. `IF NOT EXISTS`**
> 指定后，同名 Stream 已存在时不报错。

**3. `<comment>`**
> Stream 的注释，可通过 `ALTER STREAM ... SET COMMENT` 修改。

**4. `PROPERTIES`**

| 属性 | 取值 / 默认值 | 说明 |
|---|---|---|
| `type` | `append_only` / `min_delta` / `detail`<br />默认 `min_delta` | 消费类型。`append_only` 只输出新增行；`min_delta` 输出两次消费之间每个 key 的净变化；`detail` 逐条输出每一次变更。`min_delta` 与 `detail` 要求基表为 Unique Key Merge-on-Write 表且开启 `binlog.need_historical_value`；对 Duplicate Key 表，`min_delta` 按 `append_only` 处理 |
| `show_initial_rows` | `true` / `false`<br />默认 `false` | 创建 Stream 时基表已有的数据是否作为变更输出。为 `true` 时，首次读取返回基表当前的全量数据（变更类型为 `APPEND`），消费之后转为增量 |

两个属性创建后不能修改。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| CREATE_PRIV | Stream 所在的数据库 | |
| SELECT_PRIV | 基表 | |

## 注意事项

- 基表未开启 Row Binlog 时报 `Base Olap table ... need to enable row binlog for table stream`。
- `type` 为 `min_delta`（或未指定）而基表不满足条件时报 `MIN_DELTA table stream requires base mow table to enable binlog.need_historical_value=true`。
- `type` 取值不合法时报 `not supported type: <value>`。
- `CREATE OR REPLACE STREAM` 目前不支持。
- Stream 的列与基表当前的可见列一致，基表 `ADD COLUMN` / `DROP COLUMN` 后自动同步。

## 示例

1. 在 `orders` 表上创建默认类型（`min_delta`）的 Stream，只消费创建之后的变更：

    ```sql
    CREATE STREAM orders_stream ON TABLE orders;
    ```

2. 创建 `append_only` 类型的 Stream，并把基表已有的数据作为初始变更输出：

    ```sql
    CREATE STREAM IF NOT EXISTS events_stream ON TABLE events
    COMMENT 'append-only events'
    PROPERTIES (
        "type" = "append_only",
        "show_initial_rows" = "true"
    );
    ```

3. 在 `etl` 库中创建 Stream，基表位于 `ods` 库：

    ```sql
    CREATE STREAM etl.orders_stream ON TABLE ods.orders
    PROPERTIES ("type" = "detail");
    ```
