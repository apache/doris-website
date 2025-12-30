---
{
    "title": "TIMESTAMPDIFF",
    "language": "zh-CN",
    "description": "与 date-diff 函数 作用一致 TIMESTAMPDIFF 函数用于计算两个日期时间值之间的差值，并以指定的时间单位返回结果。该函数支持多种时间单位（如秒、分、时、日、周、月、年）"
}
---

## 描述

与 [date-diff 函数](./datediff) 作用一致
TIMESTAMPDIFF 函数用于计算两个日期时间值之间的差值，并以指定的时间单位返回结果。该函数支持多种时间单位（如秒、分、时、日、周、月、年）

该函数与 mysql 中的 [date_diff 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-diff) 行为一致

## 语法

```sql
TIMESTAMPDIFF(<unit>, <date_or_time_expr1>, <date_or_time_expr2>)
```

## 参数

| 参数 | 说明                                                        |
| -- |-----------------------------------------------------------|
| `<unit>` | 时间单位，指定要返回的单位，常见的值有 SECOND、MINUTE、HOUR、DAY、MONTH、QUARTERYEAR 等 |
|`<date_or_time_expr1>`| 第一个日期时间，开始日期时间，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)                                          |
|`<date_or_time_expr2>`| 第二个日期时间，结束日期时间，支持输入 date/datetime 类型                                  |

## 返回值

返回两个日期时间之间的差异，类型为 BIGINT。

- 若 `<date_or_time_expr2>` 晚于 `<date_or_time_expr1>`，返回正数；
- 若 `<dat_or_etime_expr2>` 早于 `<date_or_time_expr1>`，返回负数；
- 若任一参数为 NULL，返回 NULL；
- 若 `<unit>` 为不支持的单位，返回 错误；
- 计算一个单位时，不会忽略下一个单位，例如会计算真实差距是否满足一天，若不足则返回 0
- 月份计算特殊情况，如 1-31 与 2-28，差数为一月
- 输入 date 类型时，时间部分默认设置为 00:00:00

## 举例

```sql
-- 计算两个日期的月份差
SELECT TIMESTAMPDIFF(MONTH, '2003-02-01', '2003-05-01') AS result;
+--------+
| result |
+--------+
|      3 |
+--------+

-- 计算年份差（结束日期早于起始日期，返回负值）
SELECT TIMESTAMPDIFF(YEAR, '2002-05-01', '2001-01-01') AS result;
+--------+
| result |
+--------+
|     -1 |
+--------+

-- 计算分钟差
SELECT TIMESTAMPDIFF(MINUTE, '2003-02-01', '2003-05-01 12:05:55') AS result;
+--------+
| result |
+--------+
| 128885 |
+--------+

-- 计算真实差距不足一天
SELECT TIMESTAMPDIFF(DAY, '2023-12-31 23:59:50', '2024-01-01 00:00:05') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- 输入非法单位 QUARTER ，返回错误
SELECT TIMESTAMPDIFF(QUAR, '2023-01-01', '2023-07-01') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported time stamp diff time unit: QUAR, supported time unit: YEAR/MONTH/WEEK/DAY/HOUR/MINUTE/SECOND

-- 月份计算特殊情况（月底跨月）
SELECT TIMESTAMPDIFF(MONTH, '2023-01-31', '2023-02-28') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

SELECT TIMESTAMPDIFF(MONTH, '2023-01-31', '2023-02-27') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- 任一参数为NULL（返回NULL）
SELECT TIMESTAMPDIFF(DAY, NULL, '2023-01-01'), TIMESTAMPDIFF(DAY, '2023-01-01', NULL) AS result;
+---------------------------------------+--------+
| timestampdiff(DAY, NULL, '2023-01-01') | result |
+---------------------------------------+--------+
| NULL                                  | NULL   |
+---------------------------------------+--------+

-- 周数差计算
SELECT TIMESTAMPDIFF(WEEK, '2023-01-01', '2023-01-15') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

```