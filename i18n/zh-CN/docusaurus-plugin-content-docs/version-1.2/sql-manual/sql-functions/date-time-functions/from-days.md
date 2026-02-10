---
{
    "title": "FROM_DAYS",
    "language": "zh-CN"
}
---

## from_days
## 描述
## 语法

`DATE FROM_DAYS(INT N)`


给定一个天数，返回一个DATE。注意，为了和mysql保持一致的行为，不存在0000-02-29这个日期。

## 举例

```
mysql> select from_days(730669);
+-------------------+
| from_days(730669) |
+-------------------+
| 2000-07-03        |
+-------------------+

mysql> select from_days (5);
+--------------+
| from_days(5) |
+--------------+
| 0000-01-05   |
+--------------+

mysql> select from_days (59);
+---------------+
| from_days(59) |
+---------------+
| 0000-02-28    |
+---------------+

mysql> select from_days (60);
+---------------+
| from_days(60) |
+---------------+
| 0000-03-01    |
+---------------+
```

### keywords

    FROM_DAYS,FROM,DAYS
