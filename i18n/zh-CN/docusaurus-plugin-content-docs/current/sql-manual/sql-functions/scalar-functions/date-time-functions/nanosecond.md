---
{
    "title": "NANOSECOND",
    "language": "zh-CN",
    "description": "提取 TIMESTAMP_NS 值中的纳秒部分。"
}
---

## 描述

提取 `TIMESTAMP_NS` 值中的纳秒部分，结果包含完整的 9 位小数秒。

## 语法

```sql
NANOSECOND(<timestamp_ns>)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<timestamp_ns>` | `TIMESTAMP_NS` 类型的值。 |

## 返回值

返回 `[0, 999999999]` 范围内的 `INT`。输入为 `NULL` 时返回 `NULL`。

## 举例

```sql
SELECT NANOSECOND(CAST('2024-02-29 12:34:56.123456789' AS TIMESTAMP_NS)) AS ns;
```

```text
+-----------+
| ns        |
+-----------+
| 123456789 |
+-----------+
```

```sql
SELECT NANOSECOND(CAST(NULL AS TIMESTAMP_NS)) AS ns;
```

```text
+------+
| ns   |
+------+
| NULL |
+------+
```
