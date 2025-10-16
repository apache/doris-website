---
{
    "title": "MONTHS_ADD",
    "language": "zh-CN"
}
---

## 描述

MONTHS_ADD 函数用于向输入的日期时间值中添加指定的月份数，并返回计算后的新日期时间值。该函数支持处理 DATE、DATETIME 类型，若输入负数则等效于减去对应月份数。

该函数与 [date_add 函数](./date-add) 和 mysql 的 [date-add 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add) 使用 MONTH 为单位的行为一致。

## 语法

```sql
MONTHS_ADD(`<date_or_time_expr>`, `<nums>`)
```

## 参数

| 参数                | 说明            |
|-------------------|---------------|
| ``<date_or_time_expr>`` | 输入的日期时间值，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)  |
| ``<nums>``          | 需要加减的月份数 ,为 INT 类型，负数表示日期时间减去 nums 月份，正数表示加上 nums 月份   |

## 返回值
返回与输入 `<date_or_time_expr>` 同类型的值（DATE 或 DATETIME），表示基准时间添加指定月份后的结果。

- 若 `<months>` 为负数，函数效果等同于从基准时间中减去对应月份数（即 MONTHS_ADD (date, -n) 等价于 MONTHS_SUB (date, n)）。
- 若输入为 DATE 类型（仅包含年月日），返回结果仍为 DATE 类型；若输入为 DATETIME 类型，返回结果保留原时间部分（如 '2023-01-01 12:34:56' 添加 1 个月后为 '2023-02-01 12:34:56'）。
- 若输入日期为当月最后一天，且目标月份天数少于该日期，则自动调整为目标月份的最后一天（如 1 月 31 日加 1 个月为 2 月 28 日或 29 日，具体取决于是否为闰年）。
- 若计算结果超出日期类型的有效范围（DATE 类型：0000-01-01 至 9999-12-31；DATETIME 类型：0000-01-01 00:00:00 至 9999-12-31 23:59:59），返回错误。
- 若任一参数为 NULL，返回 NULL。


## 举例

``` sql
--- 向 DATE 类型添加月份
SELECT MONTHS_ADD('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2020-02-29 |
+------------+

--- 向 DATETIME 类型添加月份（保留时间部分）
SELECT MONTHS_ADD('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-29 02:02:02 |
+---------------------+

--- 负数月份（等价于减法）
SELECT MONTHS_ADD('2020-01-31', -1) AS result;
+------------+
| result     |
+------------+
| 2019-12-31 |
+------------+

--- 非月底日期添加月份（直接累加）
SELECT MONTHS_ADD('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-12-13 22:28:18 |
+---------------------+

--- 包含微秒的 DATETIME（保留精度）
SELECT MONTHS_ADD('2023-07-13 22:28:18.456789', 3) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-10-13 22:28:18.456789 |
+----------------------------+

--- 输入为 NULL 时返回 NULL
SELECT MONTHS_ADD(NULL, 5), MONTHS_ADD('2023-07-13', NULL) AS result;
+----------------------+--------+
| months_add(NULL, 5)  | result |
+----------------------+--------+
| NULL                 | NULL   |
+----------------------+--------+

--- 计算结果超出日期范围
mysql> SELECT MONTHS_ADD('9999-12-31', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation months_add of 9999-12-31, 1 out of range

mysql> SELECT MONTHS_ADD('0000-01-01',- 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation months_add of 0000-01-01, -1 out of range
```