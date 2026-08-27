---
{
    "title": "NANOSECONDS_ADD",
    "language": "zh-CN",
    "description": "向 TIMESTAMP_NS 值增加指定的纳秒数。"
}
---

## 描述

向 `TIMESTAMP_NS` 值增加指定的纳秒数，并保留纳秒精度。

## 语法

```sql
NANOSECONDS_ADD(<timestamp_ns>, <delta>)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<timestamp_ns>` | `TIMESTAMP_NS` 类型的基准值。 |
| `<delta>` | 要增加的纳秒数，类型为 `BIGINT`。负数表示减少纳秒。 |

## 返回值

返回 `TIMESTAMP_NS`。任一参数为 `NULL` 时返回 `NULL`；结果超出 `TIMESTAMP_NS` 的取值范围时报错。

## 举例

```sql
SELECT NANOSECONDS_ADD(
    CAST('1969-12-31 23:59:59.999999999' AS TIMESTAMP_NS), 1
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1970-01-01 00:00:00.000000000 |
+-------------------------------+
```

负数增量表示减少纳秒：

```sql
SELECT NANOSECONDS_ADD(
    CAST('1970-01-01 00:00:00.000000001' AS TIMESTAMP_NS), -2
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1969-12-31 23:59:59.999999999 |
+-------------------------------+
```

```sql
SELECT NANOSECONDS_ADD(CAST(NULL AS TIMESTAMP_NS), 1) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
