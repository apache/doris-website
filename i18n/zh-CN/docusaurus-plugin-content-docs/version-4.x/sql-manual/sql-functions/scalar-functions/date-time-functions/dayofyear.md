---
{
    "title": "DAYOFYEAR",
    "language": "zh-CN",
    "description": "DAYOFYEAR 函数用于计算日期或时间表达式对应的当年中天数，即该日期是当年的第几天。返回值为整数，范围从 1（1 月 1 日）到 366（闰年 12 月 31 日）。"
}
---

## 描述

DAYOFYEAR 函数用于计算日期或时间表达式对应的当年中天数，即该日期是当年的第几天。返回值为整数，范围从 1（1 月 1 日）到 366（闰年 12 月 31 日）。

该函数与 mysql 中的 [dayofyear 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayofyear) 行为一致

## 别名

- DOY

## 语法

```sql
DAYOFYEAR(<date_or_time_expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<date_or_time_expr>` | 参数是合法的日期表达式，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)  |

## 返回值

返回一个整数，表示日期在当年中的天数（1-366）,类型为 SMALLINT。

特殊情况：

- 若 <date_or_time_expr> 为 NULL，返回 NULL；
- 对于闰年的 2 月 29 日，会正确计算为当年的第 60 天。

## 举例

```sql

---提取 datetime 类型中的一年中的天数
select dayofyear('2007-02-03 00:00:00');
+----------------------------------+
| dayofyear('2007-02-03 00:00:00') |
+----------------------------------+
|                               34 |
+----------------------------------+

---提取 date 类型中的天数
select dayofyear('2023-12-31');
+-------------------------+
| dayofyear('2023-12-31') |
+-------------------------+
|                     365 |
+-------------------------+

---计算闰年中的天数
select dayofyear('2024-12-31');
+-------------------------+
| dayofyear('2024-12-31') |
+-------------------------+
|                     366 |
+-------------------------+

---输入为 NULL ,返回 NULL
select dayofyear(NULL);
+-----------------+
| dayofyear(NULL) |
+-----------------+
|            NULL |
+-----------------+
```