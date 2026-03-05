---
{
    "title": "TIMESTAMPADD",
    "language": "zh-CN"
}
---

## timestampadd
## 描述
## 语法

`DATETIME TIMESTAMPADD(unit, interval, DATETIME datetime_expr)`


将整数表达式间隔添加到日期或日期时间表达式datetime_expr中。

interval的单位由unit参数给出，它应该是下列值之一: 

SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, or YEAR。

## 举例

```

mysql> SELECT TIMESTAMPADD(MINUTE,1,'2019-01-02');
+------------------------------------------------+
| timestampadd(MINUTE, 1, '2019-01-02 00:00:00') |
+------------------------------------------------+
| 2019-01-02 00:01:00                            |
+------------------------------------------------+

mysql> SELECT TIMESTAMPADD(WEEK,1,'2019-01-02');
+----------------------------------------------+
| timestampadd(WEEK, 1, '2019-01-02 00:00:00') |
+----------------------------------------------+
| 2019-01-09 00:00:00                          |
+----------------------------------------------+
```
### keywords
    TIMESTAMPADD
