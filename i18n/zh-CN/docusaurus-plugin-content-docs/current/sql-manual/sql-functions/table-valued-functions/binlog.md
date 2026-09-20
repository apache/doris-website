---
{
    "title": "BINLOG",
    "language": "zh-CN",
    "description": "表函数，返回一张开启了 Row Binlog 的内表的原始行级变更记录，用于排查变更记录内容。"
}
---

## 描述

表函数，返回一张开启了 Row Binlog 的内表的原始行级变更记录。每条记录包含基表的可见列（变更后的值）、操作类型、提交时间戳、事务内序号，以及可选的变更前的值。

该函数直接读取存储的原始记录，不做折叠或过滤。

:::caution
`binlog()` 主要用于内部调试，不建议在正式数据处理流程中使用。它的输出格式和参数可能随版本变化，正式的增量消费请使用 [Table Stream](../../../data-operate/incremental/table-stream) 或 [`@incr` 增量查询](../../../data-operate/incremental/incremental-query)。
:::

该功能自 5.0.0 版本起提供，目前处于实验阶段。

## 语法

```sql
BINLOG(
    "table" = "<table_name>"
    [, "db" = "<db_name>"]
    [, "partition" = "<partition_name>[, ...]"]
    [, "tablet" = "<tablet_id>[, ...]"]
)
```

## 必填参数 (Required Parameters)

| 字段 | 描述 |
|---|---|
| **`<table_name>`** | 表名。该表必须是内表且已开启 Row Binlog（`"binlog.enable" = "true"`、`"binlog.format" = "ROW"`） |

## 可选参数 (Optional Parameters)

| 字段 | 描述 |
|---|---|
| **`<db_name>`** | 数据库名，默认为当前数据库 |
| **`<partition_name>`** | 只读取指定分区，多个分区名用逗号分隔，默认读取全部分区 |
| **`<tablet_id>`** | 只读取指定 tablet，多个 tablet ID 用逗号分隔，默认读取全部 tablet |

## 返回值

| 字段名 | 类型 | 描述 |
|---|---|---|
| 基表的可见列 | 与基表相同 | 变更后的值。删除记录在开启 `binlog.need_historical_value` 时为删除前的值，否则仅 key 列有值 |
| `__DORIS_BINLOG_OP__` | TINYINT | 操作类型：`0` 新增，`1` 更新，`2` 删除 |
| `__DORIS_BINLOG_TSO__` | BIGINT | 提交时间戳（TSO） |
| `__DORIS_BINLOG_LSN__` | BIGINT | 事务内序号 |
| `__BEFORE__<列名>__` | 与原列相同 | 变更前的值，每个非 key 列对应一个。仅基表开启 `binlog.need_historical_value` 时存在，新增记录中为 NULL |

## 示例

查看 `demo.orders` 表中订单 1 的完整变更历史：

```sql
SELECT __DORIS_BINLOG_OP__ AS op, __DORIS_BINLOG_TSO__ AS tso,
       order_id, status, amount, __BEFORE__status__, __BEFORE__amount__
FROM BINLOG("db" = "demo", "table" = "orders")
WHERE order_id = 1
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__;
```

```text
+------+--------------------+----------+---------+--------+--------------------+--------------------+
| op   | tso                | order_id | status  | amount | __BEFORE__status__ | __BEFORE__amount__ |
+------+--------------------+----------+---------+--------+--------------------+--------------------+
|    0 | 469067680972800000 |        1 | created | 100.00 | NULL               |               NULL |
|    1 | 469067681287372800 |        1 | paid    | 100.00 | created            |             100.00 |
|    2 | 469067681628160003 |        1 | paid    | 100.00 | paid               |             100.00 |
+------+--------------------+----------+---------+--------+--------------------+--------------------+
```

只读取某个分区的变更数量：

```sql
SELECT __DORIS_BINLOG_OP__, COUNT(*)
FROM BINLOG("table" = "orders", "partition" = "p20260914")
GROUP BY __DORIS_BINLOG_OP__;
```

表未开启 Row Binlog 时报错：

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = binlog<row> is not enabled for table=orders
```
