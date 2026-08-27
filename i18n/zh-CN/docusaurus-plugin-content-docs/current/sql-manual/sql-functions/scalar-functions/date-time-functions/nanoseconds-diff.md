---
{
    "title": "NANOSECONDS_DIFF",
    "language": "zh-CN",
    "description": "返回两个日期时间值之间相差的纳秒数。"
}
---

## 描述

返回两个日期时间值之间相差的纳秒数，计算方式为 `<end_time> - <start_time>`。

## 语法

```sql
NANOSECONDS_DIFF(<end_time>, <start_time>)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<end_time>` | 结束时间。至少一个参数必须为 `TIMESTAMP_NS`，另一个参数可以为 `TIMESTAMP_NS` 或 `DATETIME`。 |
| `<start_time>` | 开始时间。至少一个参数必须为 `TIMESTAMP_NS`，另一个参数可以为 `TIMESTAMP_NS` 或 `DATETIME`。 |

## 返回值

返回 `BIGINT`，表示 `<end_time> - <start_time>` 的纳秒数。任一参数为 `NULL` 时返回 `NULL`。

正数表示结束时间较晚，负数表示结束时间较早。结果必须在 `BIGINT` 的取值范围内，否则函数会报告溢出错误。

## 举例

```sql
SELECT NANOSECONDS_DIFF(
    CAST('1970-01-01 00:00:00.000000001' AS TIMESTAMP_NS),
    CAST('1969-12-31 23:59:59.999999999' AS TIMESTAMP_NS)
) AS diff;
```

```text
+------+
| diff |
+------+
|    2 |
+------+
```

参数可以混用 `TIMESTAMP_NS` 和 `DATETIME`：

```sql
SELECT NANOSECONDS_DIFF(
    CAST('1970-01-01 00:00:00.000000001' AS TIMESTAMP_NS),
    CAST('1970-01-01 00:00:00.000000' AS DATETIME(6))
) AS diff;
```

```text
+------+
| diff |
+------+
|    1 |
+------+
```

```sql
SELECT NANOSECONDS_DIFF(
    CAST(NULL AS TIMESTAMP_NS),
    CAST('1970-01-01 00:00:00.000000000' AS TIMESTAMP_NS)
) AS diff;
```

```text
+------+
| diff |
+------+
| NULL |
+------+
```
