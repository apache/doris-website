---
{
    "title": "DAYOFWEEK",
    "language": "zh-CN"
}
---

## dayofweek
## 描述
## 语法

`INT DAYOFWEEK(DATETIME date)`


DAYOFWEEK函数返回日期的工作日索引值，即星期日为1，星期一为2，星期六为7

参数为Date或者Datetime类型或者可以cast为Date或者Datetime类型的数字

## 举例

```
mysql> select dayofweek('2019-06-25');
+----------------------------------+
| dayofweek('2019-06-25 00:00:00') |
+----------------------------------+
|                                3 |
+----------------------------------+

mysql> select dayofweek(cast(20190625 as date)); 
+-----------------------------------+
| dayofweek(CAST(20190625 AS DATE)) |
+-----------------------------------+
|                                 3 |
+-----------------------------------+
```

### keywords

    DAYOFWEEK
