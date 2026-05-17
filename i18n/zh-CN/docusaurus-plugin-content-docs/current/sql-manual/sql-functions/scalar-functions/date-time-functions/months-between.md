---
{
    "title": "MONTHS_BETWEEN",
    "language": "cn",
    "description": "与 monthsdiff 函数 不同的是，month-between 函数不会忽略日单位，返回的是浮点数，代表真实差距多少个月，而不是日期上显示的月单位所差的月数 MONTHSBETWEEN 函数用于计算两个日期时间值之间的月份差值，返回结果为浮点数。"
}
---

## 描述

与 [months_diff 函数](./months-diff) 不同的是，month-between 函数不会忽略日单位，返回的是浮点数，代表真实差距多少个月，而不是日期上显示的月单位所差的月数
MONTHS_BETWEEN 函数用于计算两个日期时间值之间的月份差值，返回结果为浮点数。该函数支持处理 DATE、DATETIME 类型，并可通过可选参数控制结果是否四舍五入。

该函数与 orcle 的 [month-between 函数](https://docs.oracle.com/cd/E11882_01/olap.112/e23381/row_functions042.htm#OLAXS434) 行为一致

## 语法

```sql
MONTHS_BETWEEN(`<date_or_time_expr1>`, `<date_or_time_expr2>` [, `<round_type>`])
```

## 参数

| 参数         | 说明                                                |
|-------------------|------------------------------------------------------------|
| ``<date_or_time_expr1>``   | 结束日期，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)。     |
| ``<date_or_time_expr2>`` | 开始日期，支持输入 date/datetime 类型和符合日期时间格式的字符串. |
| ``<round_type>`` | 是否将结果四舍五入到第八位小数。支持 `true` 或 `false`。默认为 `true`。 |

## 返回值

返回 `<date_or_time_expr1>` 减去 `<date_or_time_expr2>` 得到的月份数，类型为 DOUBLE

结果 = (`<date_or_time_expr1>`.year - `<date_or_time_expr2>`.year) * 12 + `<date_or_time_expr1>`.month - `<date_or_time_expr2>`.month + (`<date_or_time_expr1>`.day - `<date_or_time_expr2>`.day) / 31.0

- 当 `<date_or_time_expr1>` 或 `<date_or_time_expr2>` 为 NULL，或两者都为 NULL 时，返回 NULL
- 当 `<round_type>` 为 true 时，结果四舍五入到第八位小数,否则和 DOUBLE 精度一样，十五位小数。
- 若 `<date_or_time_expr1>` 早于 `<date_or_time_expr2>`，返回负值；
- 时间部分（时、分、秒）不影响计算，仅基于日期部分（年、月、日）计算差值。
当 `<date_or_time_expr1>` 和 `<date_or_time_expr2>` 满足以下条件时，函数会返回整数月份差值（忽略天数带来的分数部分）：

- 两个日期均为各自月份的最后一天（如 2024-01-31 与 2024-02-29）；
- 两个日期的「日部分」相同（如 2024-01-15 与 2024-03-15）。

## 示例

```sql
--- 两个日期的月份差值
SELECT MONTHS_BETWEEN('2020-12-26', '2020-10-25') AS result;
+------------+
| result     |
+------------+
| 2.03225806 |
+------------+

--- 包含时间部分（不影响结果）
SELECT MONTHS_BETWEEN('2020-12-26 15:30:00', '2020-10-25 08:15:00') AS result;
+------------+
| result     |
+------------+
| 2.03225806 |
+------------+

--- 关闭四舍五入（保留原始精度）
SELECT MONTHS_BETWEEN('2020-10-25', '2020-12-26', false) AS result;
+---------------------+
| result              |
+---------------------+
| -2.032258064516129  |
+---------------------+

--- 均为月末日期（触发特殊处理，返回整数）
SELECT MONTHS_BETWEEN('2024-02-29', '2024-01-31') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- 日部分相同（触发特殊处理，返回整数）
SELECT MONTHS_BETWEEN('2024-03-15', '2024-01-15') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

--- 日部分不同且非月末
SELECT MONTHS_BETWEEN('2024-02-29', '2024-01-30') AS result;
+------------+
| result     |
+------------+
| 0.96774194 |
+------------+

--- 输入为 NULL（返回 NULL）
SELECT MONTHS_BETWEEN(NULL, '2024-01-01') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

```
