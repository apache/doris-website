---
{
    "title": "MONTH_FLOOR",
    "language": "zh-CN"
}
---

## month_floor
## 描述
## 语法

```sql
DATETIME MONTH_FLOOR(DATETIME datetime)
DATETIME MONTH_FLOOR(DATETIME datetime, DATETIME origin)
DATETIME MONTH_FLOOR(DATETIME datetime, INT period)
DATETIME MONTH_FLOOR(DATETIME datetime, INT period, DATETIME origin)
```

将日期转化为指定的时间间隔周期的最近下取整时刻。

- datetime：参数是合法的日期表达式。
- period：参数是指定每个周期有多少天组成。
- origin：开始的时间起点，如果不填，默认是 0001-01-01T00:00:00。

## 举例

```
mysql> select month_floor("2023-07-13 22:28:18", 5);
+--------------------------------------------------------------+
| month_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+--------------------------------------------------------------+
| 2023-05-01 00:00:00                                          |
+--------------------------------------------------------------+
1 row in set (0.12 sec)
```

### keywords

    MONTH_FLOOR, MONTH, FLOOR
