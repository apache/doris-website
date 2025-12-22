---
{
    "title": "DATE",
    "language": "zh-CN",
    "description": "DATE 函数用于从日期时间值(包含日期和时间)中提取出纯日期部分，忽略时间信息。该函数可将 DATETIME 类型转换为 DATE 类型，仅保留年、月、日信息。"
}
---

## 描述

DATE 函数用于从日期时间值(包含日期和时间)中提取出纯日期部分，忽略时间信息。该函数可将 DATETIME 类型转换为 DATE 类型，仅保留年、月、日信息。

该函数与 mysql 中的 [date 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date) 行为一致

## 语法

```sql
DATE(<date_or_time_part>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<date_or_time_part>` | 合法的日期表达式,支持的类型为 datetime ，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)) |

## 返回值

若输入有效，返回 DATE 类型的纯日期值（格式为 YYYY-MM-DD），不含时间部分。

特殊情况：
- 输入为 NULL 时，返回 NULL；

## 举例

```sql
---提取日期时间中的日期部分
mysql> select date(cast('2010-12-02 19:28:30' as datetime));
+-----------------------------------------------+
| date(cast('2010-12-02 19:28:30' as datetime)) |
+-----------------------------------------------+
| 2010-12-02                                    |
+-----------------------------------------------+

--- 提取日期中的日期部分
mysql> select date(cast('2015-11-02' as date));
+----------------------------------+
| date(cast('2015-11-02' as date)) |
+----------------------------------+
| 2015-11-02                       |
+----------------------------------+

---输入为NULL
mysql> select date(NULL);
+------------+
| date(NULL) |
+------------+
| NULL       |
+------------+

```