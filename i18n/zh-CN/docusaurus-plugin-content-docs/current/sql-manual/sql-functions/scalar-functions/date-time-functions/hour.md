---
{
    "title": "HOUR",
    "language": "zh-CN",
    "description": "HOUR 函数用于提取日期时间或时间表达式中的小时部分。该函数支持多种时间类型输入，包括 DATE/DATETIME、TIME ，返回对应小时数值。"
}
---

## 描述

HOUR 函数用于提取日期时间或时间表达式中的小时部分。该函数支持多种时间类型输入，包括  DATE/DATETIME、TIME ，返回对应小时数值。

对于 DATETIME （如 '2023-10-01 14:30:00'），返回值范围为 0-23（24 小时制）。
对于 TIME 类型（如 '456:26:32'），返回值可超出 24，范围为 [0,838]。

该函数与 mysql 中的 [hour 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_hour) 行为一致。

## 语法

```sql
HOUR(`<date_or_time_expr>`)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<date_or_time_expr>` | 参数是合法的日期表达式，支持输入 datetime/date/time 类型,date 类型会转换为对应日期的一天起始时间 00:00:00 ,具体 datetime/date/time 格式请查看  [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) 和 [time的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/time-conversion) |

## 返回值

返回整数类型（INT），表示输入表达式中的小时部分。
- 对于 DATETIME ，返回 0-23 的整数。
- 对于 DATE 类型 ，返回 0.
- 对于 TIME 类型，返回 0 至 838 的整数（与 TIME 类型的范围一致），返回的是绝对值，没有负数。
- 输入参数为 NULL，返回 NULL

## 举例

```sql
-- 从日期时间中提取小时（24小时制）
select 
    hour('2018-12-31 23:59:59') as last_hour,
    hour('2023-01-01 00:00:00') as midnight,   
    hour('2023-10-01 12:30:45') as noon;     

+-----------+----------+------+
| last_hour | midnight | noon |
+-----------+----------+------+
|        23 |        0 |   12 |
+-----------+----------+------+

-- 从 TIME 类型中提取小时（支持超过24或负数）
select 
    hour(cast('14:30:00' as time)) as normal_hour,     
    hour(cast('25:00:00' as time)) as over_24,
    hour(cast('456:26:32' as time)) as large_hour,     
    hour(cast('-12:30:00' as time)) as negative_hour, 
    hour(cast('838:59:59' as time)) as max_hour,    
    hour(cast('-838:59:59' as time)) as min_hour;    

+-------------+---------+------------+---------------+----------+----------+
| normal_hour | over_24 | large_hour | negative_hour | max_hour | min_hour |
+-------------+---------+------------+---------------+----------+----------+
|          14 |      25 |        456 |            12 |      838 |      838 |
+-------------+---------+------------+---------------+----------+----------+

--- 从 date 类型中提取小时，返回 0
select hour("2022-12-12");
+--------------------+
| hour("2022-12-12") |
+--------------------+
|                  0 |
+--------------------+

---不会主动将输入时间字符串转换为 time ,返回 NULL
select hour('14:30:00') as normal_hour;
+-------------+
| normal_hour |
+-------------+
|        NULL |
+-------------+

---输入参数为 NULL ，返回 NULL
mysql> select hour(NULL);
+------------+
| hour(NULL) |
+------------+
|       NULL |
+------------+
```

