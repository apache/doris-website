---
{
    "title": "SECOND_CEIL",
    "language": "zh-CN"
}
---

## second_ceil
## 描述
## 语法

```sql
DATETIME SECOND_CEIL(DATETIME datetime)
DATETIME SECOND_CEIL(DATETIME datetime, DATETIME origin)
DATETIME SECOND_CEIL(DATETIME datetime, INT period)
DATETIME SECOND_CEIL(DATETIME datetime, INT period, DATETIME origin)
```

将日期转化为指定的时间间隔周期的最近上取整时刻。

- datetime：参数是合法的日期表达式。
- period：参数是指定每个周期有多少秒组成。
- origin：开始的时间起点，如果不填，默认是 0001-01-01T00:00:00。

## 举例

```
mysql> select second_ceil("2023-07-13 22:28:18", 5);
+--------------------------------------------------------------+
| second_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+--------------------------------------------------------------+
| 2023-07-13 22:28:20                                          |
+--------------------------------------------------------------+
1 row in set (0.01 sec)
```

### keywords

    SECOND_CEIL, SECOND, CEIL
