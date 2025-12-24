---
{
    "title": "MINUTES_SUB",
    "language": "zh-CN",
    "description": "MINUTESSUB 函数用于从输入的日期时间值中减去指定的分钟数，并返回计算后的新日期时间值。该函数支持处理 DATE、DATETIME类型."
}
---

## 描述

MINUTES_SUB 函数用于从输入的日期时间值中减去指定的分钟数，并返回计算后的新日期时间值。该函数支持处理 DATE、DATETIME类型.

该函数与 [date_sub 函数](./date-sub) 和 mysql 的 [date-add 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add) 使用 MINUTE 为单位的行为一致。

## 语法

```sql
MINUTES_SUB(`<date_or_time_expr>`, `<minutes>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| ``<date_or_time_expr>`` | 输入的日期时间值，类型可以是 DATE、DATETIME ，具体 datetime/date 请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| ``<minutes>`` | 要减去的分钟数，类型为 BIGINT，可以为正数或负数 |

## 返回值


返回类型为 DATETIME，表示减去指定分钟数后的日期时间值。

- 若 `<minutes>` 为负数，函数效果等同于向基准时间中添加对应分钟数（即 MINUTES_SUB(date, -n) 等价于 MINUTES_ADD(date, n)）。
- 若输入为 DATE 类型（仅包含年月日），默认其时间部分为 00:00:00。
- 若输入的日期时间包含微秒部分，减去分钟后会保留原微秒精度（如 '2023-01-01 00:01:00.123456' 减去 1 分钟后为 '2023-01-01 00:00:00.123456'）。
- 若计算结果超出 DATETIME 类型的有效范围（0000-01-01 00:00:00 至 9999-12-31 23:59:59.999999），抛出异常。
- 若任一参数为 NULL，返回 NULL。


## 举例

```sql
--- 从 DATETIME 中减去分钟
SELECT MINUTES_SUB('2020-02-02 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-02 02:01:02 |
+---------------------+


--- 包含微秒的时间（保留精度）
SELECT MINUTES_SUB('2023-07-13 22:38:18.456789', 10) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:28:18.456789 |
+----------------------------+

--- 负数分钟（等价于加法）
SELECT MINUTES_SUB('2023-07-13 22:23:18', -5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:28:18 |
+---------------------+

--- 输入为 DATE 类型（默认时间 00:00:00）
SELECT MINUTES_SUB('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-12 23:30:00 |
+---------------------+

--- 任一参数为 NULL，返回 NULL
SELECT MINUTES_SUB(NULL, 10), MINUTES_SUB('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| MINUTES_SUB(NULL, 10) | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+


--- 计算结果超出日期时间范围，报错
SELECT MINUTES_SUB('0000-01-01 00:00:00', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minutes_add of 0000-01-01 00:00:00, -1 out of range
```
