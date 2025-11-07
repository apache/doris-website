---
{
    "title": "EXTRACT",
    "language": "zh-CN"
}
---

## extract
## 描述
## 语法

`INT extract(unit FROM DATETIME)`

提取DATETIME某个指定单位的值。单位可以为year, month, day, hour, minute, second 或者 microsecond

## 举例

```
mysql> select extract(year from '2022-09-22 17:01:30') as year,
    -> extract(month from '2022-09-22 17:01:30') as month,
    -> extract(day from '2022-09-22 17:01:30') as day,
    -> extract(hour from '2022-09-22 17:01:30') as hour,
    -> extract(minute from '2022-09-22 17:01:30') as minute,
    -> extract(second from '2022-09-22 17:01:30') as second,
    -> extract(microsecond from cast('2022-09-22 17:01:30.000123' as datetimev2(6))) as microsecond;
+------+-------+------+------+--------+--------+-------------+
| year | month | day  | hour | minute | second | microsecond |
+------+-------+------+------+--------+--------+-------------+
| 2022 |     9 |   22 |   17 |      1 |     30 |         123 |
+------+-------+------+------+--------+--------+-------------+
```

### keywords

    extract
