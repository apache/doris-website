---
{
    "title": "MONTHNAME",
    "language": "zh-CN"
}
---

## 描述

MONTHNAME 函数用于返回日期时间值对应的英文月份名称。该函数支持处理 DATE、DATETIME 类型，返回值为完整的英文月份名称（January 到 December）。

该函数与 mysql 的 [monthname 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_monthname) 使用 MINUTE 为单位的行为一致。

## 语法

```sql
MONTHNAME(`<date_or_time_expr>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| ``<date_or_time_expr>`` | 输入的日期时间值，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## 返回值

返回类型为 VARCHAR，表示月份的英文名称：
- 返回值范围：January, February, March, April, May, June, July, August, September, October, November, December
- 如果输入为 NULL，返回 NULL
- 返回值首字母大写，其余字母小写

## 举例

```sql
--- 从 DATE 类型中获取英文月份名称
SELECT MONTHNAME('2008-02-03') AS result;
+----------+
| result   |
+----------+
| February |
+----------+

--- 从 DATETIME 类型中获取英文月份名称
SELECT MONTHNAME('2023-07-13 22:28:18') AS result;
+---------+
| result  |
+---------+
| July    |
+---------+

--- 输入为 NULL 时返回 NULL
SELECT MONTHNAME(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
