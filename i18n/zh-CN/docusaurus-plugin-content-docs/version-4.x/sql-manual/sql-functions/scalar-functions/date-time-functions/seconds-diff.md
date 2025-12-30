---
{
    "title": "SECONDS_DIFF",
    "language": "zh-CN",
    "description": "SECONDSDIFF 函数用于计算两个日期时间值之间的差值，并以秒为单位返回结果。该函数支持处理 DATE、DATETIME 类型，若输入为 DATE 类型，默认其时间部分为 00:00:00。"
}
---

## 描述

SECONDS_DIFF 函数用于计算两个日期时间值之间的差值，并以秒为单位返回结果。该函数支持处理 DATE、DATETIME 类型，若输入为 DATE 类型，默认其时间部分为 00:00:00。


## 语法

```sql
SECONDS_DIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```

## 参数

| 参数                 | 说明                                 |
|--------------------|------------------------------------|
| `<date_or_time_expr1>`   | 必填，结束的日期时间值，类型可以是 DATE、DATETIME，具体 datetime/date 请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)  |
| `<date_or_time_expr2>` | 必填，起始的日期时间值，类型可以是 DATE、DATETIME。。 |

## 返回值

返回类型为 BIGINT，表示两个日期时间之间的秒数差：

- 若 <date_or_time_expr1> 晚于 <date_or_time_expr2>，返回正数；
- 若 <date_or_time_expr1> 早于 <date_or_time_expr2>，返回负数；
- 若两个时间相等，返回 0；
- 若任一参数为 NULL，返回 NULL；
- 包含 scale 的时间,会把小数部分差距算入

## 举例
```sql
--- 同一小时内的秒差
SELECT SECONDS_DIFF('2025-01-23 12:35:56', '2025-01-23 12:34:56') AS result;
+--------+
| result |
+--------+
|     60 |
+--------+

--- 结束时间早于起始时间（返回负数）
SELECT SECONDS_DIFF('2023-01-01 00:00:00', '2023-01-01 00:01:00') AS result;
+--------+
| result |
+--------+
|    -60 |
+--------+

--- 输入为 DATE 类型（默认时间 00:00:00）
SELECT SECONDS_DIFF('2023-01-02', '2023-01-01') AS result;  -- 相差1天（86400秒）
+--------+
| result |
+--------+
|  86400 |
+--------+

--- 包含 scale 的时间,会把小数部分差距算入
mysql> SELECT SECONDS_DIFF('2023-07-13 12:00:00', '2023-07-13 11:59:59.6') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- 任一参数为 NULL（返回 NULL）
SELECT SECONDS_DIFF(NULL, '2023-07-13 10:30:25'), SECONDS_DIFF('2023-07-13 10:30:25', NULL) AS result;
+-------------------------------------------+--------+
| seconds_diff(NULL, '2023-07-13 10:30:25') | result |
+-------------------------------------------+--------+
| NULL                                      | NULL   |
+-------------------------------------------+--------+
```