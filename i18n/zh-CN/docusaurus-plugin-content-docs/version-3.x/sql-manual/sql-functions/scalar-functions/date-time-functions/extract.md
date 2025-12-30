---
{
    "title": "EXTRACT",
    "language": "zh-CN",
    "description": "extract 函数用于从日期或时间值中提取指定的部分，如年份、月份、日、小时、分钟、秒等。该函数常用于从日期时间字段中提取具体的时间组件进行计算、比较或展示。"
}
---

## 描述

`extract` 函数用于从日期或时间值中提取指定的部分，如年份、月份、日、小时、分钟、秒等。该函数常用于从日期时间字段中提取具体的时间组件进行计算、比较或展示。

## 语法

`EXTRACT(<unit> FROM <datetime>)`

## 参数

| 参数 | 说明 |
| -- | -- |
| `unit` | 提取 DATETIME 某个指定单位的值。单位可以为 year, month, day, hour, minute, second 或者 microsecond |
| `datetime` | 参数是合法的日期表达式 |

## 返回值

返回的是提取出的日期或时间的某个部分（如整数），具体的部分取决于提取的单位。

## 举例

```sql
select extract(year from '2022-09-22 17:01:30') as year,
extract(month from '2022-09-22 17:01:30') as month,
extract(day from '2022-09-22 17:01:30') as day,
extract(hour from '2022-09-22 17:01:30') as hour,
extract(minute from '2022-09-22 17:01:30') as minute,
extract(second from '2022-09-22 17:01:30') as second,
extract(microsecond from cast('2022-09-22 17:01:30.000123' as datetimev2(6))) as microsecond;
```

```text
+------+-------+------+------+--------+--------+-------------+
| year | month | day  | hour | minute | second | microsecond |
+------+-------+------+------+--------+--------+-------------+
| 2022 |     9 |   22 |   17 |      1 |     30 |         123 |
+------+-------+------+------+--------+--------+-------------+
```
