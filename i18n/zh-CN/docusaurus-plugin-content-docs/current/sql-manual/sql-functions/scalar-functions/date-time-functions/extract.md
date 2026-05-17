---
{
    "title": "EXTRACT",
    "language": "zh-CN",
    "description": "EXTRACT 函数用于从日期或时间值中提取指定的时间组件，如年份、月份、周、日、小时、分钟、秒等。该函数可精确获取日期时间中的特定部分。"
}
---

## 描述

`EXTRACT` 函数用于从日期或时间值中提取指定的时间组件，如年份、月份、周、日、小时、分钟、秒等。该函数可精确获取日期时间中的特定部分。

该函数与 mysql 中的 [extract 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_extract) 行为一致。

## 语法

`EXTRACT(<unit> FROM <date_or_time_expr>)`

## 参数

| 参数 | 说明 |
| -- | -- |
| `<unit>` | 枚举值：YEAR, QUARTER, MONTH, WEEK,DAY, HOUR, MINUTE, SECOND, YEAR_MONTH, DAY_HOUR, DAY_MINUTE, DAY_SECOND, DAY_MICROSECOND, HOUR_MINUTE, HOUR_SECOND, HOUR_MICROSECOND, MINUTE_SECOND, MINUTE_MICROSECOND, SECOND_MICROSECOND, DAYOFWEEK(DOW), DAYOFYEAR(DOY) |
| `<datetime_or_time_expr>` | 参数是合法的日期表达式，支持输入 date/datetime 类型和符合日期时间格式的字符串，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)  |

## 返回值

返回的是提取出的日期或时间的某个部分。
- 对于独立类型如`YEAR`和[DAYOFWEEK(DOW)](./dayofweek.md), [DAYOFYEAR(DOY)](./dayofyear.md)， 返回类型为 INT
- 对于复合类型如`YEAR_MONTH`, 返回类型为 STRING

week 单位的取值范围为 0-53，计算规则如下：

- 以 星期日为一周的第一天。
- 当年的第一个星期日所在的周为第 1 周。
- 在第一个星期日之前的日期属于第 0 周。
单位为 year, month, day, hour, minute, second,microsecond 时，返回日期时间中对应的单位数值.

单位为 quarter 时，1-3 月返回 1，4-6 月返回2， 7-9 月返回 3，10-12 返回 4.

特殊情况：
- 若 <date_or_time_expr> 为 NULL，返回 NULL。
- 若 <unit> 为不支持单位，报错

复合单位返回格式如下：
| time_unit          | 返回格式                                  |
| ------------------ | ----------------------------------------- |
| YEAR_MONTH         | 'YEARS-MONTHS'                            |
| DAY_HOUR           | 'DAYS HOURS'                              |
| DAY_MINUTE         | 'DAYS HOURS:MINUTES'                      |
| DAY_SECOND         | 'DAYS HOURS:MINUTES:SECONDS'              |
| DAY_MICROSECOND    | 'DAYS HOURS:MINUTES:SECONDS.MICROSECONDS' |
| HOUR_MINUTE        | 'HOURS:MINUTES'                           |
| HOUR_SECOND        | 'HOURS:MINUTES:SECONDS'                   |
| HOUR_MICROSECOND   | 'HOURS:MINUTES:SECONDS.MICROSECONDS'      |
| MINUTE_SECOND      | 'MINUTES:SECONDS'                         |
| MINUTE_MICROSECOND | 'MINUTES:SECONDS.MICROSECONDS'            |
| SECOND_MICROSECOND | 'SECONDS.MICROSECONDS'                    |

## 举例

```sql
-- 提取日期时间中的 year, month, day, hour, minute, second, microsecond 时间组件
select extract(year from '2022-09-22 17:01:30') as year,
extract(month from '2022-09-22 17:01:30') as month,
extract(day from '2022-09-22 17:01:30') as day,
extract(hour from '2022-09-22 17:01:30') as hour,
extract(minute from '2022-09-22 17:01:30') as minute,
extract(second from '2022-09-22 17:01:30') as second,
extract(microsecond from cast('2022-09-22 17:01:30.000123' as datetime(6))) as microsecond;

+------+-------+------+------+--------+--------+-------------+
| year | month | day  | hour | minute | second | microsecond |
+------+-------+------+------+--------+--------+-------------+
| 2022 |     9 |   22 |   17 |      1 |     30 |         123 |
+------+-------+------+------+--------+--------+-------------+

-- 提取日期时间中的 quarter
mysql> select extract(quarter from '2023-05-15') as quarter;
+---------+
| quarter |
+---------+
|       2 |
+---------+

-- 提取对应日期的周数，因为 2024 年的第一个周日在 1 月 7 日，所以 01-07 之前都返回0
select extract(week from '2024-01-06') as week;
+------+
| week |
+------+
|    0 |
+------+

-- 1 月 7 日为第一个周日，返回 1
select extract(week from '2024-01-07') as week;
+------+
| week |
+------+
|    1 |
+------+

-- 在这个规则下，2024 年的周数只有 0-52
select extract(week from '2024-12-31') as week;
+------+
| week |
+------+
|   52 |
+------+

select extract(year_month from '2026-01-01 11:45:14.123456') as year_month,
       extract(day_hour from '2026-01-01 11:45:14.123456') as day_hour,
       extract(day_minute from '2026-01-01 11:45:14.123456') as day_minute,
       extract(day_second from '2026-01-01 11:45:14.123456') as day_second,
       extract(day_microsecond from '2026-01-01 11:45:14.123456') as day_microsecond,
       extract(hour_minute from '2026-01-01 11:45:14.123456') as hour_minute,
       extract(hour_second from '2026-01-01 11:45:14.123456') as hour_second,
       extract(hour_microsecond from '2026-01-01 11:45:14.123456') as hour_microsecond,
       extract(minute_second from '2026-01-01 11:45:14.123456') as minute_second,
       extract(minute_microsecond from '2026-01-01 11:45:14.123456') as minute_microsecond,
       extract(second_microsecond from '2026-01-01 11:45:14.123456') as second_microsecond;

+------------+----------+------------+-------------+-----------------------+-------------+-------------+-----------------------+--------------+----------------------+-------------------+
| year_month | day_hour | day_minute | day_second  | day_microsecond       | hour_minute | hour_second | hour_microsecond      | minute_second| minute_microsecond   | second_microsecond |
+------------+----------+------------+-------------+-----------------------+-------------+-------------+-----------------------+--------------+----------------------+-------------------+
| 2026-01    | 1 11     | 1 11:45    | 1 11:45:14  | 1 11:45:14.123456     | 11:45       | 11:45:14    | 11:45:14.123456       | 45:14        | 45:14.123456         | 14.123456         |
+------------+----------+------------+-------------+-----------------------+-------------+-------------+-----------------------+--------------+----------------------+-------------------+

-- 输入单位不存在，报错
select extract(uint from '2024-01-07') as week;
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'uint'
```
