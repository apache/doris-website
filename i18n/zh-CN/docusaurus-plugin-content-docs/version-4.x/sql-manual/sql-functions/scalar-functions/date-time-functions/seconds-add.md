---
{
    "title": "SECONDS_ADD",
    "language": "zh-CN",
    "description": "SECONDSADD 函数用于在指定的日期时间值上增加或减少指定的秒数，并并返回计算后的日期时间值。该函数支持处理 DATE、DATETIME 类型，若输入负数则等效于减去对应秒数。"
}
---

## 描述
SECONDS_ADD 函数用于在指定的日期时间值上增加或减少指定的秒数，并并返回计算后的日期时间值。该函数支持处理 DATE、DATETIME 类型，若输入负数则等效于减去对应秒数。

该函数与 [date_add 函数](./date-add) 和 mysql 中的 [date_add 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add) 使用 SECOND 为单位的行为一致

## 语法

```sql
SECONDS_ADD(<date_or_time_expr>, <seconds>)
```
## 参数

| 参数           | 说明                                          |
|--------------|---------------------------------------------|
| `<date_or_time_expr>` | 必填，输入的日期时间值，类型可以是 DATE、DATETIME ，具体 datetime/date 请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)           |
| `<seconds>`  | 必填，要增加或减少的秒数，支持整数类型（BIGINT）。正数表示增加秒数，负数表示减少秒数。 |

## 返回值

返回一个日期时间值，类型与输入的 <date_or_time_expr> 类型一致。

- 若 <seconds> 为负数，函数效果等同于从基准时间中减去对应秒数（即 SECONDS_ADD(date, -n) 等价于 SECONDS_SUB(date, n)）。
- 若输入为 DATE 类型（仅包含年月日），默认其时间部分为 00:00:00/
- 若计算结果超出日期类型的有效范围（DATE 类型：0000-01-01 至 9999-12-31；DATETIME 类型：0000-01-01 00:00:00 至 9999-12-31 23:59:59.999999），返回错误。
- 若任一参数为 NULL，返回 NULL。


## 举例
```sql
--- 向 DATETIME 类型添加秒数
SELECT SECONDS_ADD('2025-01-23 12:34:56', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:26 |
+---------------------+

--- 从 DATETIME 类型减去秒数（使用负数）
SELECT SECONDS_ADD('2025-01-23 12:34:56', -30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:26 |
+---------------------+

--- 跨分钟边界的秒数添加
SELECT SECONDS_ADD('2023-07-13 23:59:50', 15) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-14 00:00:05 |
+---------------------+

--- 输入为 DATE 类型（默认时间 00:00:00）
SELECT SECONDS_ADD('2023-01-01', 3600) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 01:00:00 |
+---------------------+

--- 包含 scale 的 DATETIME（保留精度）
SELECT SECONDS_ADD('2023-07-13 10:30:25.123456', 2) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 10:30:27.123456 |
+----------------------------+

--- 输入为 NULL 时返回 NULL
SELECT SECONDS_ADD(NULL, 30), SECONDS_ADD('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| seconds_add(NULL, 30)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- 计算结果超出日期范围
SELECT SECONDS_ADD('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 9999-12-31 23:59:59, 2 out of range

select seconds_add('0000-01-01 00:00:30',-31);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 0000-01-01 00:00:30, -31 out of range
```