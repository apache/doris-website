---
{
  "title": "YEAR_CEIL",
  "language": "zh-CN"
}
---

## year_ceil
## 描述
## 语法

```sql
DATETIME YEAR_CEIL(DATETIME datetime)
DATETIME YEAR_CEIL(DATETIME datetime, DATETIME origin)
DATETIME YEAR_CEIL(DATETIME datetime, INT period)
DATETIME YEAR_CEIL(DATETIME datetime, INT period, DATETIME origin)
```

将日期转化为指定的时间间隔周期的最近上取整时刻。

- datetime：参数是合法的日期表达式。
- period：参数是指定每个周期有几年组成。
- origin：开始的时间起点，如果不填，默认是 0001-01-01T00:00:00。

## 举例

```
mysql> select year_ceil("2023-07-13 22:28:18", 5);
+------------------------------------------------------------+
| year_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+------------------------------------------------------------+
| 2025-01-01 00:00:00                                        |
+------------------------------------------------------------+
1 row in set (0.02 sec)
```

### keywords

    YEAR_CEIL, YEAR, CEIL

### Best Practice

还可参阅 [date_ceil](./date_ceil)
