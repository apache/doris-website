---
{
    "title": "YEARS_DIFF",
    "language": "zh-CN",
    "description": "YEARSDIFF 函数用于计算两个日期或时间值之间的完整年数差值，结果为结束时间减去开始时间的年数。支持处理 DATE、DATETIME 类型，计算时会考虑完整的时间差（包括月份、日期及时分秒）。"
}
---

## 描述
YEARS_DIFF 函数用于计算两个日期或时间值之间的完整年数差值，结果为结束时间减去开始时间的年数。支持处理 DATE、DATETIME 类型，计算时会考虑完整的时间差（包括月份、日期及时分秒）。

## 语法

```sql
YEARS_DIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr1>` | 结束日期，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<date_or_time_expr2>` | 开始日期，支持输入 date/datetime 类型和符合日期时间格式的字符串 |

## 返回值

返回 INT 类型的整数，表示 <date_or_time_expr1> 与 <date_or_time_expr2> 之间的完整年数差值：

- 若 <date_or_time_expr1> 晚于 <date_or_time_expr2>，返回正数（需满足 “满一年” 条件，如'2022-03-15 08:30:00', '2021-03-15 09:10:00' 实际相差日期时间不满一年，返回 0）。
- 若<date_or_time_expr1> 早于 <date_or_time_expr2>，返回负数（计算方式同上，结果取负）。
- 若输入为 DATE 类型，默认其时间部分为 00:00:00.
- 若任一参数为 NULL，返回 NULL。
- 闰年2月特殊情况（如2024是闰年，2月29日 vs 2023年2月28日，满一年）

## 举例

```sql
--- 年份差1年，且月-日相等（满一年）
SELECT YEARS_DIFF('2020-12-25', '2019-12-25') AS diff_full_year;
+----------------+
| diff_full_year |
+----------------+
|              1 |
+----------------+

-- 年份差1年，但结束月-日早于开始月-日（不足一年）
SELECT YEARS_DIFF('2020-11-25', '2019-12-25') AS diff_less_than_year;
+---------------------+
| diff_less_than_year |
+---------------------+
|                   0 |
+---------------------+

-- 包含时间部分的DATETIME类型（
SELECT YEARS_DIFF('2022-03-15 08:30:00', '2021-03-15 09:10:00') AS diff_datetime;
+---------------+
| diff_datetime |
+---------------+
|             0 |
+---------------+

-- DATE与DATETIME混合计算，输入 date 类型会把时间部分默认设置为 00:00:00
SELECT YEARS_DIFF('2024-05-20', '2020-05-20 12:00:00') AS diff_mixed;
+-----------+
| diff_mixed |
+-----------+
|         3 |
+-----------+

-- 结束时间早于开始时间，返回负数
SELECT YEARS_DIFF('2018-06-10', '2020-06-10') AS diff_negative;
+---------------+
| diff_negative |
+---------------+
|            -2 |
+---------------+

-- 闰年2月特殊情况（2024是闰年，2月29日 vs 2023年2月28日，满一年）
SELECT YEARS_DIFF('2024-02-29', '2023-02-28') AS leap_year_diff;
+----------------+
| leap_year_diff |
+----------------+
|              1 |
+----------------+

-- 任一参数为NULL（返回NULL）
SELECT 
  YEARS_DIFF(NULL, '2023-03-15') AS null_input1,
  YEARS_DIFF('2023-03-15', NULL) AS null_input2;
+------------+------------+
| null_input1 | null_input2 |
+------------+------------+
| NULL       | NULL       |
+------------+------------+
```
