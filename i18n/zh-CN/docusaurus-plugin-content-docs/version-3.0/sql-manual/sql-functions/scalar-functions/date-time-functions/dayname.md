---
{
    "title": "DAYNAME",
    "language": "zh-CN"
}
---

## 描述

DAYNAME 函数用于计算日期或时间表达式对应的星期名称（如“Tuesday” 等），返回值为字符串类型。

该函数与 mysql 中的 [dayname 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayname) 行为一致

## 语法

```sql
DAYNAME(<date_or_time_expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<date_or_time_expr>` | 参数是合法的日期表达式，支持输入 date/datetime 类型和符合日期时间格式的字符串,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## 返回值

返回日期对应的星期名称（字符串类型）

特殊情况：

- 若 `date_or_time_expr` 为 NULL，返回 NULL；

## 举例

```sql

---计算 DATETIME 类型对应的星期名称
select dayname('2007-02-03 00:00:00');

+--------------------------------+
| dayname('2007-02-03 00:00:00') |
+--------------------------------+
| Saturday                       |
+--------------------------------+

---计算 DATE 类型对应的星期名称

select dayname('2023-10-01');
+-----------------------+
| dayname('2023-10-01') |
+-----------------------+
| Sunday                |
+-----------------------+


---参数为 NULL，返回 NULL
select dayname(NULL);
+---------------+
| dayname(NULL) |
+---------------+
| NULL          |
+---------------+
```