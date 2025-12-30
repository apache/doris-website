---
{
    "title": "WEEKDAY",
    "language": "zh-CN",
    "description": "WEEKDAY 函数返回日期的工作日索引值，即星期一为 0，星期二为 1，星期日为 6"
}
---

## 描述

WEEKDAY 函数返回日期的工作日索引值，即星期一为 0，星期二为 1，星期日为 6

注意 WEEKDAY 和 DAYOFWEEK 的区别：
```
          +-----+-----+-----+-----+-----+-----+-----+
          | Sun | Mon | Tues| Wed | Thur| Fri | Sat |
          +-----+-----+-----+-----+-----+-----+-----+
  weekday |  6  |  0  |  1  |  2  |  3  |  4  |  5  |
          +-----+-----+-----+-----+-----+-----+-----+
dayofweek |  1  |  2  |  3  |  4  |  5  |  6  |  7  |
          +-----+-----+-----+-----+-----+-----+-----+
```
该函数与 mysql 中的 [weekday 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weekday) 行为一致。

## 语法
```sql
WEEKDAY (`<date_or_time_expr>`)
```
## 参数

| 参数                         | 描述                          |
|----------------------------|-----------------------------|
| `<datetime_or_date>` | 输入的日期时间值，支持输入 date/datetime 类型，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## 返回值
返回值为日期所在的周中所对应的索引，为 INT 类型。

- 若输入为 NULL ，则返回 NULL

## 举例

```sql
-- 2023-10-09 是星期一，返回 0
SELECT WEEKDAY('2023-10-09'); 
+-------------------------+
| WEEKDAY('2023-10-09')   |
+-------------------------+
| 0                       |
+-------------------------+

-- 2023-10-15 是星期日，返回 6
SELECT WEEKDAY('2023-10-15 18:30:00'); 
+----------------------------------+
| WEEKDAY('2023-10-15 18:30:00')   |
+----------------------------------+
| 6                                |
+----------------------------------+

---输入为 NULL,返回 NULL
SELECT WEEKDAY(NULL);
+---------------+
| WEEKDAY(NULL) |
+---------------+
|          NULL |
+---------------+
```

