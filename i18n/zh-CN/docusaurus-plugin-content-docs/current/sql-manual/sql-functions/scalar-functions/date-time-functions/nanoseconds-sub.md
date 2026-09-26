---
{
    "title": "NANOSECONDS_SUB",
    "language": "zh-CN",
    "description": "从 TIMESTAMP_NS 值中减去指定的纳秒数。"
}
---

## 描述

从 `TIMESTAMP_NS` 值中减去指定的纳秒数，并保留纳秒精度。

## 语法

```sql
NANOSECONDS_SUB(<timestamp_ns>, <delta>)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<timestamp_ns>` | `TIMESTAMP_NS` 类型的基准值。 |
| `<delta>` | 要减去的纳秒数，类型为 `BIGINT`。负数表示增加纳秒。 |

## 返回值

返回 `TIMESTAMP_NS`。任一参数为 `NULL` 时返回 `NULL`；结果超出 `TIMESTAMP_NS` 的取值范围时报错。

## 举例

```sql
SELECT NANOSECONDS_SUB(
    CAST('1970-01-01 00:00:00.000000000' AS TIMESTAMP_NS), 1
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1969-12-31 23:59:59.999999999 |
+-------------------------------+
```

负数增量表示增加纳秒：

```sql
SELECT NANOSECONDS_SUB(
    CAST('1969-12-31 23:59:59.999999999' AS TIMESTAMP_NS), -1
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1970-01-01 00:00:00.000000000 |
+-------------------------------+
```

```sql
SELECT NANOSECONDS_SUB(CAST(NULL AS TIMESTAMP_NS), 1) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
