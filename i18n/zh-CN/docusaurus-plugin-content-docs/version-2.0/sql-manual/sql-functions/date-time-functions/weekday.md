---
{
    "title": "WEEKDAY",
    "language": "zh-CN"
}
---

## weekday
## 描述
## 语法

`INT WEEKDAY (DATETIME date)`


WEEKDAY函数返回日期的工作日索引值，即星期一为0，星期二为1，星期日为6

参数为Date或者Datetime类型或者可以cast为Date或者Datetime类型的数字

注意WEEKDAY和DAYOFWEEK的区别：
```
          +-----+-----+-----+-----+-----+-----+-----+
          | Sun | Mon | Tues| Wed | Thur| Fri | Sat |
          +-----+-----+-----+-----+-----+-----+-----+
  weekday |  6  |  0  |  1  |  2  |  3  |  4  |  5  |
          +-----+-----+-----+-----+-----+-----+-----+
dayofweek |  1  |  2  |  3  |  4  |  5  |  6  |  7  |
          +-----+-----+-----+-----+-----+-----+-----+
```

## 举例

```
mysql> select weekday('2019-06-25');
+--------------------------------+
| weekday('2019-06-25 00:00:00') |
+--------------------------------+
|                              1 |
+--------------------------------+

mysql> select weekday(cast(20190625 as date)); 
+---------------------------------+
| weekday(CAST(20190625 AS DATE)) |
+---------------------------------+
|                               1 |
+---------------------------------+
```

### keywords
    WEEKDAY
