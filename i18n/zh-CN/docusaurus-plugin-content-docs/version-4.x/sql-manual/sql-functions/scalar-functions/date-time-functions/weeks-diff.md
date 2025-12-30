---
{
    "title": "WEEKS_DIFF",
    "language": "zh-CN",
    "description": "WEEKSDIFF 函数用于计算两个日期或时间值之间的完整周数差值，结果为结束时间减去开始时间的周数（以 7 天为 1 周）。支持处理 DATE、DATETIME 类型及符合格式的字符串，计算时会考虑完整的时间差（包括时分秒）。"
}
---

## 描述
WEEKS_DIFF 函数用于计算两个日期或时间值之间的完整周数差值，结果为结束时间减去开始时间的周数（以 7 天为 1 周）。支持处理 DATE、DATETIME 类型及符合格式的字符串，计算时会考虑完整的时间差（包括时分秒）。

## 语法

```sql
WEEKS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## 参数
| 参数                        | 描述                      |
|----------------------------|--------------------------|
| `<date_or_time_expr1>`   |较晚的日期或者日期时间,支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)|
| `<date_or_time_expr2>` | 较早的日期或者日期时间,支持输入 date/datetime 类型 |

## 返回值

返回 INT 类型的整数，表示 `<date_or_time_expr1>` 与 `<date_or_time_expr2>` 之间的完整周数差值：

- 若 `<date_or_time_expr1>` 晚于 `<date_or_time_expr2>`，返回正数（总天数差 ÷ 7 取整数部分）。
- 若 `<date_or_time_expr1>` 早于 `<date_or_time_expr2>`，返回负数（计算方式同上，结果取负）。
- 若输入为 DATE 类型，默认其时间部分为 00:00:00。
- 计算时会考虑完整的时间差（包括时分秒），仅统计 “满 7 天” 的部分，不足一周的天数忽略。
- 若任一参数为 NULL，返回 NULL。
- 仅统计 “满 7 天” 的部分，例如相差 8 天返回 1 周，相差 6 天返回 0 周。例如 '2023-10-08 00:00:00' 与 '2023-10-01 12:00:00' 相差 6.5 天，返回 0 周；而 '2023-10-08 12:00:00' 与 '2023-10-01 00:00:00' 相差 7.5 天，返回 1 周。

## 举例
```sql
-- 两个DATE类型相差8周（56天）
SELECT WEEKS_DIFF('2020-12-25', '2020-10-25') AS diff_date;
+-----------+
| diff_date |
+-----------+
|         8 |
+-----------+

-- 包含时间部分的DATETIME类型（总天数差56天，忽略时分秒差异）
SELECT WEEKS_DIFF('2020-12-25 10:10:02', '2020-10-25 12:10:02') AS diff_datetime;
+---------------+
| diff_datetime |
+---------------+
|             8 |
+---------------+

-- DATE与DATETIME混合计算（DATE默认00:00:00）
SELECT WEEKS_DIFF('2020-12-25 10:10:02', '2020-10-25') AS diff_mixed;
+-------------+
| diff_mixed  |
+-------------+
|           8 |
+-------------+

-- 不足1周（6天），返回0
SELECT WEEKS_DIFF('2023-10-07', '2023-10-01') AS diff_6_days;
+-------------+
| diff_6_days |
+-------------+
|           0 |
+-------------+

-- 超过1周（8天），返回1
SELECT WEEKS_DIFF('2023-10-09', '2023-10-01') AS diff_8_days;
+-------------+
| diff_8_days |
+-------------+
|           1 |
+-------------+

-- 时间部分影响：差7.5天（返回1）与6.5天（返回0）
SELECT 
  WEEKS_DIFF('2023-10-08 12:00:00', '2023-10-01 00:00:00') AS diff_7_5d,
  WEEKS_DIFF('2023-10-08 00:00:00', '2023-10-01 12:00:00') AS diff_6_5d;
+-----------+-----------+
| diff_7_5d | diff_6_5d |
+-----------+-----------+
|         1 |         0 |
+-----------+-----------+

-- 结束时间早于开始时间，返回负数
SELECT WEEKS_DIFF('2023-10-01', '2023-10-08') AS diff_negative;
+---------------+
| diff_negative |
+---------------+
|            -1 |
+---------------+

-- 跨年度计算（2023-12-25到2024-01-01相差7天，返回1）
SELECT WEEKS_DIFF('2024-01-01', '2023-12-25') AS cross_year;
+------------+
| cross_year |
+------------+
|          1 |
+------------+

-- 任一参数为NULL（返回NULL）
SELECT 
  WEEKS_DIFF(NULL, '2023-10-01') AS null_input1,
  WEEKS_DIFF('2023-10-01', NULL) AS null_input2;
+------------+------------+
| null_input1 | null_input2 |
+------------+------------+
| NULL       | NULL       |
+------------+------------+
```