---
{
    "title": "TIMESTAMP_NS",
    "language": "zh-CN",
    "description": "TIMESTAMP_NS 用于存储不带时区、固定纳秒精度的日期时间。"
}
---

## 描述

`TIMESTAMP_NS` 用于存储不带时区、固定纳秒精度的日期时间，适合事件时间、链路追踪以及 `DATETIME(6)` 的微秒精度无法满足需求的场景。

Doris 在内部使用相对于 Unix epoch 的有符号 64 位纳秒数存储该类型。因此，一个 `TIMESTAMP_NS` 列占用 8 字节，精确取值范围为：

```text
[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]
```

输出格式为 `yyyy-MM-dd HH:mm:ss.SSSSSSSSS`。小数秒始终显示 9 位，包括末尾的零。

与 `DATETIME(p)` 不同，`TIMESTAMP_NS` 的精度不可配置，`TIMESTAMP_NS(9)` 等声明均不合法。

`TIMESTAMP_NS` 可以作为 Key 列、分区列、分桶列、Sequence 列和值列，也可以用于 `ARRAY`、`MAP`、`STRUCT` 和带类型的 `VARIANT` 值。

## 语法

```sql
TIMESTAMP_NS
```

## 时区语义

`TIMESTAMP_NS` 不存储时区。值写入后，修改会话变量 `time_zone` 不会改变该值。

当输入字符串包含时区偏移或时区名称时，Doris 会在解析阶段将其转换为会话时区或导入时区对应的日期时间，再以不带时区的形式存储；当输入不包含时区时，Doris 直接存储输入的各日期时间字段。

如果一个值表示需要随会话时区转换显示的绝对时间点，请使用 [`TIMESTAMPTZ`](./TIMESTAMPTZ.md)。

## 转换与运算

输入字符串最多保留 9 位小数秒。提供更多小数位时，Doris 会四舍五入到纳秒，进位可能传递到下一秒或下一天。超出有效范围的值不合法。

`TIMESTAMP_NS` 支持与数字、字符、`DATE`、`DATETIME`、`TIME`、`TIMESTAMPTZ` 和 `VARIANT` 类型相互转换。转换为较低精度的时间类型时，会四舍五入到目标精度。完整规则请参见[转换为 TIMESTAMP_NS](../conversion/timestamp-ns-conversion.md)。

日期时间提取、格式化、加减、比较、聚合、条件和窗口函数均支持 `TIMESTAMP_NS`。运算结果仍为 `TIMESTAMP_NS` 时会保留全部 9 位小数秒；结果超出有效范围时会报错，不会发生环绕。

纳秒专用函数请参见 [`NANOSECOND`](../../../sql-functions/scalar-functions/date-time-functions/nanosecond.md)、[`NANOSECONDS_ADD`](../../../sql-functions/scalar-functions/date-time-functions/nanoseconds-add.md)、[`NANOSECONDS_SUB`](../../../sql-functions/scalar-functions/date-time-functions/nanoseconds-sub.md) 和 [`NANOSECONDS_DIFF`](../../../sql-functions/scalar-functions/date-time-functions/nanoseconds-diff.md)。

## 举例

创建表并存储纳秒值：

```sql
CREATE TABLE events (
    id BIGINT,
    event_time TIMESTAMP_NS
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO events VALUES
    (1, '1970-01-01 00:00:00.000000001'),
    (2, '2024-02-29 12:34:56.123456789'),
    (3, NULL);

SELECT * FROM events ORDER BY id;
```

```text
+------+-------------------------------+
| id   | event_time                    |
+------+-------------------------------+
|    1 | 1970-01-01 00:00:00.000000001 |
|    2 | 2024-02-29 12:34:56.123456789 |
|    3 | NULL                          |
+------+-------------------------------+
```

第 10 位小数会四舍五入到纳秒：

```sql
SELECT CAST('1970-01-01 00:00:00.1234567895' AS TIMESTAMP_NS) AS ts;
```

```text
+-------------------------------+
| ts                            |
+-------------------------------+
| 1970-01-01 00:00:00.123456790 |
+-------------------------------+
```

时区后缀只在解析输入时生效。修改会话时区不会改变已经存储的值：

```sql
SET time_zone = '+08:00';
CREATE TABLE timezone_example (
    id INT,
    ts TIMESTAMP_NS
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO timezone_example VALUES
    (1, '2023-08-17T01:41:18.123456789Z');

SET time_zone = '+00:00';
SELECT ts FROM timezone_example;
```

```text
+-------------------------------+
| ts                            |
+-------------------------------+
| 2023-08-17 09:41:18.123456789 |
+-------------------------------+
```

输入为 `NULL` 时返回 `NULL`：

```sql
SELECT CAST(NULL AS TIMESTAMP_NS) AS ts;
```

```text
+------+
| ts   |
+------+
| NULL |
+------+
```
