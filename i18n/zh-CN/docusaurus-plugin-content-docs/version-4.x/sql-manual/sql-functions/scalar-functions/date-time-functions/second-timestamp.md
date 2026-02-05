---
{
    "title": "SECOND_TIMESTAMP",
    "language": "zh-CN",
    "description": "SECONDTIMESTAMP 函数用于将输入的日期时间值转换为 Unix 时间戳（以秒为单位），该时间戳表示从 1970-01-01 00:00:00 UTC 开始到指定日期时间的总秒数。该函数支持处理 DATETIME，该函数结果会加上机器所在的时区偏移，时区部分请查看 时区管理。"
}
---

## 描述
SECOND_TIMESTAMP 函数用于将输入的日期时间值转换为 Unix 时间戳（以秒为单位），该时间戳表示从 1970-01-01 00:00:00 UTC 开始到指定日期时间的总秒数。该函数支持处理 DATETIME，该函数结果会加上机器所在的时区偏移，时区部分请查看 [时区管理](../../../../admin-manual/cluster-management/time-zone)。

## 别名
- UNIX_TIMESTAMP()

## 语法

```sql
SECOND_TIMESTAMP(<datetime>)
```

## 参数

| 参数           | 说明                                      |
|--------------|-----------------------------------------|
| `<datetime>` | 必填，输入的 DATETIME 值，表示要转换为 Unix 时间戳的日期时间。支持输入 datetime 类型,具体 datetime 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)  |

## 返回值

返回类型为 BIGINT，表示输入日期时间转换为当前时区所对应的 Unix 时间戳（以秒为单位）。

特殊情况说明:
- 若输入为 DATE 类型（仅包含年月日），默认其时间部分为 00:00:00；
- 若输入的日期时间早于 1970-01-01 00:00:00，返回负数时间戳；
- 若 `<datetime>` 为 NULL，返回 NULL；

## 举例

```sql
--- 输入初始日期，返回 0
SELECT SECOND_TIMESTAMP('1970-01-01 00:00:00') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- DATETIME 类型转时间戳
SELECT SECOND_TIMESTAMP('2025-01-23 12:34:56') AS result;
+------------+
| result     |
+------------+
| 1737606896 |
+------------+

--- DATE 类型（默认时间为 00:00:00）
SELECT SECOND_TIMESTAMP('2023-01-01') AS result;
+------------+
| result     |
+------------+
| 1672502400 |
+------------+

--- 早于 1970-01-01 的日期（返回负数）
SELECT SECOND_TIMESTAMP('1964-10-31 23:59:59') AS result;
+------------+
| result     |
+------------+
| -163065601 |
+------------+

--- 带有微秒的 DATETIME（忽略微秒）
SELECT SECOND_TIMESTAMP('2023-07-13 22:28:18.456789') AS result;
+------------+
| result     |
+------------+
| 1689258498 |
+------------+

--- 输入为 NULL（返回 NULL）
SELECT SECOND_TIMESTAMP(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

```