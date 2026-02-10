---
{
    "title": "DAY",
    "language": "zh-CN",
    "description": "DAY 函数用于提取日期或时间表达式中的“日”部分，返回值为整数，范围从 1 到 31（具体取决于月份和年份）。"
}
---

## 描述

DAY 函数用于提取日期或时间表达式中的“日”部分，返回值为整数，范围从 1 到 31（具体取决于月份和年份）。

该函数与 mysql 中的 [day 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_day) 行为一致

## 别名

- dayofmonth

## 语法

```sql
DAY(<date_or_time_expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<date_or_time_expr>` | 参数是合法的日期表达式，支持输入 date/datetime 类型，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)|

## 返回值

返回日期中“日”的整数信息（1-31）。

特殊情况：

若 `dt` 为 NULL，返回 NULL；

## 举例


```sql

--从 DATE 类型中提取日
select day('1987-01-31');
+----------------------------+
| day('1987-01-31 00:00:00') |
+----------------------------+
|                         31 |
+----------------------------+

---从 DATETIME 类型中提取日（忽略时间部分）
select day('2023-07-13 22:28:18');
+----------------------------+
| day('2023-07-13 22:28:18') |
+----------------------------+
|                         13 |
+----------------------------+

---输入为 NULL
select day(NULL);
+-----------+
| day(NULL) |
+-----------+
|      NULL |
+-----------+
```