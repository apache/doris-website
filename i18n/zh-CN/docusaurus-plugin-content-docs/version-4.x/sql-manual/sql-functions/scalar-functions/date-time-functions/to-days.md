---
{
    "title": "TO_DAYS",
    "language": "zh-CN",
    "description": "日期计算函数，它用于将日期转换为天数数值，即计算从零日期(0000-00-00)到指定日期的总天数。"
}
---

## 描述
日期计算函数，它用于将日期转换为天数数值，即计算从零日期(`0000-00-00`)到指定日期的总天数。

该函数与 mysql 中的 [to_days 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_to-days) 行为一致。

## 语法

```sql
TO_DAYS(`<date_or_time_expr>`)
```

## 参数
| 参数                         | 描述                          |
|----------------------------|-----------------------------|
| `<date_or_time_expr>` | 输入的日期时间值，支持输入 date/datetime 类型，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |


## 举例

```sql
-- 以`0000-00-00`为基准日期
select to_days('0000-01-01');
+-----------------------+
| to_days('0000-01-01') |
+-----------------------+
|                     1 |
+-----------------------+

--输入 date 类型
select to_days('2007-10-07');
+---------------------------------------+
| to_days('2007-10-07') |
+---------------------------------------+
|                                733321 |
+---------------------------------------+

-- 输入 datetime 类型
select to_days('2007-10-07 10:03:09');
+------------------------------------------------+
| to_days('2007-10-07 10:03:09') |
+------------------------------------------------+
|                                         733321 |
+------------------------------------------------+
```