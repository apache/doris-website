---
{
  "title": "TO_SECONDSS",
  "language": "zh-CN"
}
---

## 描述
秒数计算函数，它用于将日期转换为秒数值，即计算从公元 1 年 12 月 31 日（基准日期）到指定日期的总天数。

该函数与 mysql 中的 [to_seconds 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_to-seconds) 行为一致。

## 语法

```sql
TO_SECONDS(`<date_or_time_expr>`)
```

## 参数
| 参数                         | 描述                          |
|----------------------------|-----------------------------|
| `<date_or_time_expr>` | 输入的日期时间值，支持输入 date/datetime 类型，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |


## 举例

```sql
select to_seconds('2025-01-01'), to_seconds(20250101);
+--------------------------+----------------------+
| to_seconds('2025-01-01') | to_seconds(20250101) |
+--------------------------+----------------------+
|              63902908800 |          63902908800 |
+--------------------------+----------------------+

SELECT
    to_seconds('2025-01-01 11:22:33') AS datetime_type,
    to_seconds(20250101112233) AS int_type;
+---------------+-------------+
| datetime_type | int_type    |
+---------------+-------------+
|   63902949753 | 63902949753 |
+---------------+-------------+

SELECT to_seconds(NULL);
+------------------+
| to_seconds(NULL) |
+------------------+
|             NULL |
+------------------+
```