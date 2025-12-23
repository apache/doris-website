---
{
    "title": "MINUTES_ADD",
    "language": "zh-CN",
    "description": "MINUTESADD 函数用于向输入的日期时间值中添加指定的分钟数，并返回计算后的新日期时间值。该函数支持处理 DATE、DATETIME类型。"
}
---

## 描述

MINUTES_ADD 函数用于向输入的日期时间值中添加指定的分钟数，并返回计算后的新日期时间值。该函数支持处理 DATE、DATETIME类型。

该函数与 [date_add 函数](./date-add) 和 mysql 的 [date-add 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add) 使用 MINUTE 为单位的行为一致。

## 语法

```sql
MINUTES_ADD(`<date_or_time_expr>`, `<minutes>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| ``<date_or_time_expr>`` | 输入的日期时间值，类型可以是 DATE、DATETIME ，具体 datetime/date 请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion), |
| ``<minutes>`` | 要增加的分钟数，类型为 BIGINT，可以为正数或负数 |

## 返回值

返回 DATETIME 类型的值，表示基准时间添加指定分钟后的结果。

- 若 `<minutes>` 为负数，函数效果等同于从基准时间中减去对应分钟数（即 MINUTES_ADD(date, -n) 等价于 MINUTES_SUB(date, n)）。
- 若输入为 DATE 类型（仅包含年月日），默认其时间部分为 00:00:00。
- 若输入的日期时间包含微秒部分，添加分钟后会保留原微秒精度（如 '2023-01-01 00:00:00.123456' 添加 1 分钟后为 '2023-01-01 00:01:00.123456'）。
- 若计算结果超出 DATETIME 类型的有效范围（0000-01-01 00:00:00 至 9999-12-31 23:59:59.999999），抛出异常。
- 若任一参数为 NULL，返回 NULL。

## 举例

```sql
--- 向 DATE 类型添加分钟（默认时间 00:00:00）
SELECT MINUTES_ADD('2020-02-02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-02 00:01:00 |
+---------------------+

--- 向 DATETIME 添加分钟
SELECT MINUTES_ADD('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:33:18 |
+---------------------+

--- 包含微秒的时间（保留精度）
SELECT MINUTES_ADD('2023-07-13 22:28:18.456789', 10) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:38:18.456789 |
+----------------------------+

--- 负数分钟（等价于减法）
SELECT MINUTES_ADD('2023-07-13 22:28:18', -5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:23:18 |
+---------------------+

--- 任一参数为 NULL，返回 NULL
SELECT MINUTES_ADD(NULL, 10), MINUTES_ADD('2023-07-13 22:28:18', NULL) AS result;
+-------------------------+--------+
| minutes_add(NULL, 10)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- 计算结果超出日期时间范围，报错
SELECT MINUTES_ADD('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minutes_add of 9999-12-31 23:59:59, 2 out of range
```