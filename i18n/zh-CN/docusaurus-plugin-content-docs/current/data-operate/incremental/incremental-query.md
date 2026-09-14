---
{
    "title": "增量查询",
    "language": "zh-CN",
    "description": "不创建 Table Stream，直接用 @incr 按时间窗口读取 Doris 内表的行级变更，支持 APPEND_ONLY / MIN_DELTA / DETAIL 三种增量模式。"
}
---

<!-- 知识类型: 操作指南 + 语法说明 -->
<!-- 适用场景: 临时按时间段取增量 / 外部系统自管消费位点 -->

在开启了 [Row Binlog](row-binlog.md) 的表上，除了通过 [Table Stream](table-stream.md) 消费变更，还可以用 `@incr` 直接在查询里按时间窗口读取表的变更，不需要创建任何对象，也不记录消费位点。它是无状态的普通查询，可以和 WHERE、JOIN、聚合等任意组合。

:::caution 实验性功能
该功能自 5.0.0 版本起提供，目前处于实验阶段。`@incr` 当前请在存算一体模式下使用，存算分离模式的支持仍在完善中。
:::

## 与 Table Stream 的区别

| | `@incr` 增量查询 | Table Stream |
|---|---|---|
| 是否需要创建对象 | 否 | 是 |
| 读取范围 | 用户指定的时间窗口 | 上次消费位点到当前 |
| 位点由谁维护 | 用户自己（例如外部调度系统记录上次的窗口） | Doris 按分区维护，随消费事务原子推进 |
| 重复读取 | 同一窗口可以反复读 | 消费后不再返回 |
| 适合 | 临时分析、回溯某段时间的变更、外部系统已有自己的位点管理 | 持续的增量 ETL，要求不重不漏 |

## 语法

```sql
SELECT ... FROM <table_name>@incr(
    ["startTimestamp" = "<datetime>",]
    ["endTimestamp"   = "<datetime>",]
    ["incrementType"  = "<APPEND_ONLY | MIN_DELTA | DETAIL>"]
) [PARTITION (<partition_name>, ...)] [<alias>]
[WHERE ...]
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `startTimestamp` | 不限 | 可选。窗口起点，格式 `yyyy-MM-dd HH:mm:ss`，按会话 `time_zone` 解析。返回提交时间 **大于等于** 起点的变更 |
| `endTimestamp` | 不限 | 可选。窗口终点，格式同上。返回提交时间 **小于** 终点的变更 |
| `incrementType` | `MIN_DELTA` | 可选。增量模式，见下文 |

三个参数都可以省略，`t@incr()` 等价于按 `MIN_DELTA` 读取全部变更历史。窗口为左闭右开区间 `[startTimestamp, endTimestamp)`，起点晚于终点或起点在未来时返回空结果。

结果包含基表的可见列以及下列隐藏列：

| 隐藏列 | 说明 |
|---|---|
| `__DORIS_BINLOG_OP__` | 变更类型：`0` 新增（APPEND），`1` 删除（DELETE），`2` 更新前（UPDATE_BEFORE），`3` 更新后（UPDATE_AFTER） |
| `__DORIS_BINLOG_TSO__` | 变更的提交时间戳 |
| `__DORIS_BINLOG_LSN__` | 事务内序号，与 TSO 一起用于排序 |

## 三种增量模式

| 模式 | 输出 | 对基表的要求 |
|---|---|---|
| `APPEND_ONLY` | 窗口内新增的行。更新、删除不输出 | 开启 Row Binlog |
| `MIN_DELTA` | 窗口内每个 key 的净变化：窗口起点不存在、终点存在 → 一条 APPEND；起点存在、终点存在且期间被修改过 → 一条 UPDATE_BEFORE（起点时的值）+ 一条 UPDATE_AFTER（终点时的值）；起点存在、终点不存在 → 一条 DELETE；起点不存在、终点也不存在 → 不输出 | MoW 表需开启 `binlog.need_historical_value` |
| `DETAIL` | 窗口内的每一条变更，更新拆成 UPDATE_BEFORE 和 UPDATE_AFTER 两行 | 开启 Row Binlog |

对 Duplicate Key 表，三种模式的结果相同：Duplicate Key 表只有新增，没有折叠的余地。

## 示例

沿用 [快速上手](quick-start.md) 中的 `orders` 表（Unique Key MoW，开启 before 镜像），假设两批写入的时间如下：

```sql
-- 10:00 第一批
INSERT INTO orders VALUES (1, 'created', 100.00), (2, 'created', 200.00), (3, 'created', 300.00);

-- 10:05 第二批
INSERT INTO orders VALUES (1, 'paid', 100.00);      -- 更新订单 1
DELETE FROM orders WHERE order_id = 2;              -- 删除订单 2
INSERT INTO orders VALUES (4, 'created', 400.00);   -- 新增订单 4
INSERT INTO orders VALUES (5, 'created', 500.00);   -- 新增订单 5
DELETE FROM orders WHERE order_id = 5;              -- 又删除订单 5
```

**MIN_DELTA：10:03 到 10:10 之间的净变化**

```sql
SELECT order_id, status, amount, __DORIS_BINLOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "MIN_DELTA"
)
ORDER BY order_id, op;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | created | 100.00 |    2 |
|        1 | paid    | 100.00 |    3 |
|        2 | created | 200.00 |    1 |
|        4 | created | 400.00 |    0 |
+----------+---------+--------+------+
```

订单 5 在窗口内先新增后删除，净变化为空，不输出。

**APPEND_ONLY：同一窗口内新增的行**

```sql
SELECT order_id, status, amount, __DORIS_BINLOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "APPEND_ONLY"
)
ORDER BY order_id;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        4 | created | 400.00 |    0 |
|        5 | created | 500.00 |    0 |
+----------+---------+--------+------+
```

订单 1 的更新和订单 2 的删除被过滤；订单 5 的新增会输出，之后的删除不会撤销这条新增记录。

**DETAIL：同一窗口内的每一条变更**

```sql
SELECT order_id, status, amount, __DORIS_BINLOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "DETAIL"
)
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__, op;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | created | 100.00 |    2 |
|        1 | paid    | 100.00 |    3 |
|        2 | created | 200.00 |    1 |
|        4 | created | 400.00 |    0 |
|        5 | created | 500.00 |    0 |
|        5 | created | 500.00 |    1 |
+----------+---------+--------+------+
```

**不指定窗口：从表创建至今的净变化**

```sql
SELECT order_id, status, amount, __DORIS_BINLOG_OP__ AS op
FROM orders@incr()
ORDER BY order_id;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | paid    | 100.00 |    0 |
|        3 | created | 300.00 |    0 |
|        4 | created | 400.00 |    0 |
+----------+---------+--------+------+
```

从表创建开始算，每个 key 起点都不存在，因此仍然存在的 key 都输出为 APPEND（值为最新值），已删除的订单 2 和 5 不输出。

## 使用建议

- 用外部调度系统做增量时，把上一次的 `endTimestamp` 作为下一次的 `startTimestamp`，窗口左闭右开保证不重不漏。要注意窗口是按提交时间划分的，正在执行、尚未提交的事务不会出现在当前窗口，而会出现在它提交后的窗口里。
- 只需要最新值、不需要更新前的值时，可以只保留 `__DORIS_BINLOG_OP__ IN (0, 1, 3)` 的行。
- `@incr` 查询会读取窗口内的全部变更记录，窗口越大、读取越多，请尽量指定窗口。

## 限制

- 基表必须开启 Row Binlog，否则报 `INCR query requires ROW binlog enabled on base table.`。
- `MIN_DELTA` 模式要求基表是 Unique Key MoW 表并开启 `binlog.need_historical_value`，否则报 `MIN_DELTA INCR query requires base table to be UNIQUE KEY with enable_unique_key_merge_on_write=true` 或 `... requires base table to enable binlog.need_historical_value=true`。
- 只能读取基表（base index），不支持指定物化视图或 rollup。
- 不支持 `PREAGGOPEN` hint。
- 参数名以外的 key 会报 `Unsupported parameter in incr query`。
