---
{
    "title": "YEAR",
    "language": "zh-CN",
    "description": "YEAR 函数用于提取指定日期或时间值中的年份部分，返回整数形式的年份。支持处理 DATE、DATETIME 类型"
}
---

## 描述
YEAR 函数用于提取指定日期或时间值中的年份部分，返回整数形式的年份。支持处理 DATE、DATETIME 类型

该函数与 mysql 中的 [year 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_year) 行为一致

## 语法
```sql
YEAR(<date_or_time_expr>)
```

## 参数

| 参数                  | 说明                                                       |
|---------------------|----------------------------------------------------------|
| `<date_or_time_expr>`       | 要向上舍入的日期时间值，支持输入 date/datetime 类型，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)                              |

## 返回值

返回 date/datetime 类型的 year 部分，INT 类型，范围从 0-9999

- 若输入的参数为 NULL，返回 NULL

## 举例

```sql
-- 提取DATE类型的年份
SELECT YEAR('1987-01-01') AS year_date;
+-----------+
| year_date |
+-----------+
|      1987 |
+-----------+

-- 提取DATETIME类型的年份（忽略时分秒）
SELECT YEAR('2024-05-20 14:30:25') AS year_datetime;
+---------------+
| year_datetime |
+---------------+
|          2024 |
+---------------+


-- 输入为NULL（返回NULL）
SELECT YEAR(NULL) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+
```

