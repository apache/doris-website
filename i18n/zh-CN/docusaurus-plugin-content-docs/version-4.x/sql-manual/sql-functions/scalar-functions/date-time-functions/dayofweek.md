---
{
    "title": "DAYOFWEEK",
    "language": "zh-CN",
    "description": "DAYOFWEEK 函数用于返回日期或时间表达式对应的星期索引值，遵循星期日为 1，星期一为 2，……，星期六为 7 的规则。"
}
---

## 描述

DAYOFWEEK 函数用于返回日期或时间表达式对应的星期索引值，遵循星期日为 1，星期一为 2，……，星期六为 7 的规则。

该函数与 mysql 中的 [dayofweek 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayofweek) 行为一致

## 别名

- DOW()

## 语法

```sql
DAYOFWEEK(<date_or_time_expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<date_or_time_expr>` | 参数是合法的日期表达式，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## 返回值

返回一个整数，表示日期对应的星期索引值（1-7，其中 1 代表星期日，7 代表星期六）。

特殊情况：

若 `<date_or_time_expr>` 为 NULL，返回 NULL；

## 举例

```sql
---计算 date 类型的星期索引值
select dayofweek('2019-06-25');
+----------------------------------+
| dayofweek('2019-06-25 00:00:00') |
+----------------------------------+
|                                3 |
+----------------------------------+

---计算 datetime 类型的星期索引值
select dayofweek('2019-06-25 15:30:45');
+----------------------------------+
| dayofweek('2019-06-25 15:30:45') |
+----------------------------------+
|                                3 |
+----------------------------------+

---星期日的索引
select dayofweek('2024-02-18');
+-------------------------+
| dayofweek('2024-02-18') |
+-------------------------+
|                       1 |
+-------------------------+

---输入日期时间为 NULL，返回 NULL
select dayofweek(NULL);
+-----------------+
| dayofweek(NULL) |
+-----------------+
|            NULL |
+-----------------+
```