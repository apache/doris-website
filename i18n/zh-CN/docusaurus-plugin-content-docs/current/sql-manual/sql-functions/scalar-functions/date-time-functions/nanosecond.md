---
{
    "title": "NANOSECOND",
    "language": "zh-CN",
    "description": "NANOSECOND 提取 DATE、DATETIME 或 TIMESTAMP_NS 值中的纳秒部分；DATE 返回 0，DATETIME 的小数秒在末尾补零到 9 位。"
}
---

## 描述

提取 `DATE`、`DATETIME` 或 `TIMESTAMP_NS` 值中的纳秒部分。输入为 `DATE` 时始终返回 0；输入为 `DATETIME(p)` 时，在小数秒末尾补零到 9 位后返回；输入为 `TIMESTAMP_NS` 时返回完整的 9 位小数秒。

## 语法

```sql
NANOSECOND(<date>)
NANOSECOND(<datetime>)
NANOSECOND(<timestamp_ns>)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<date>` | `DATE` 类型的值。 |
| `<datetime>` | `DATETIME(p)` 类型的值，其中 `p` 的取值范围为 0 到 6。 |
| `<timestamp_ns>` | `TIMESTAMP_NS` 类型的值。 |

## 返回值

返回 `[0, 999999999]` 范围内的 `INT`。输入为 `DATE` 时返回 0；输入为 `DATETIME(p)` 时，返回其小数秒换算成纳秒并在末尾补零到 9 位后的值；输入为 `TIMESTAMP_NS` 时返回完整的 9 位小数秒。输入为 `NULL` 时返回 `NULL`。

## 举例

```sql
SELECT NANOSECOND(CAST('2024-02-29' AS DATE)) AS ns;
```

```text
+----+
| ns |
+----+
|  0 |
+----+
```

```sql
SELECT NANOSECOND(CAST('2024-02-29 12:34:56.123456' AS DATETIME(6))) AS ns;
```

```text
+-----------+
| ns        |
+-----------+
| 123456000 |
+-----------+
```

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
