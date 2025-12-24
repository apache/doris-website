---
{
    "title": "EXTRACT",
    "language": "zh-CN",
    "description": "EXTRACT 函数用于从日期或时间值中提取指定的时间组件，如年份、月份、周、日、小时、分钟、秒等。该函数可精确获取日期时间中的特定部分。"
}
---

## 描述

`EXTRACT` 函数用于从日期或时间值中提取指定的时间组件，如年份、月份、周、日、小时、分钟、秒等。该函数可精确获取日期时间中的特定部分。

该函数与 mysql 中的 [extract 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_extract) 行为基本一致，不同的是，doris 目前暂不支持联合单位输入，如：

```sql
mysql> SELECT EXTRACT(YEAR_MONTH FROM '2019-07-02 01:02:03');
        -> 201907
```

## 语法

`EXTRACT(<unit> FROM <date_or_time_expr>)`

## 参数

| 参数 | 说明 |
| -- | -- |
| `<unit>` | 提取 DATETIME 某个指定单位的值。单位可以为 year, month, week, day, hour, minute, second 或者 microsecond |
| `<datetime_or_time_expr>` | 参数是合法的日期表达式，支持输入 date/datetime 类型和符合日期时间格式的字符串，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)  |

## 返回值

返回的是提取出的日期或时间的某个部分,类型为 INT，具体的部分取决于提取的单位。

week 单位的取值范围为 0-53，计算规则如下：

- 以 星期日为一周的第一天。
- 当年的第一个星期日所在的周为第 1 周。
- 在第一个星期日之前的日期属于第 0 周。
单位为 year, month, day, hour, minute, second,microsecond 时，返回日期时间中对应的单位数值.

单位为 quarter 时，1-3 月返回 1，4-6 月返回2， 7-9 月返回 3，10-12 返回 4.

特殊情况：

若 <date_or_time_expr> 为 NULL，返回 NULL。
若 <unit> 为不支持单位，报错

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

-- 输入单位不存在，报错
select extract(uint from '2024-01-07') as week;
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'uint'
```
