---
{
    "title": "YEARS_ADD",
    "language": "zh-CN",
    "description": "YEARSADD 函数用于在指定的日期或时间值上增加（或减少）指定数量的年数，返回调整后的日期或时间。支持处理 DATE、DATETIME 类型，年数可为正数（增加）或负数（减少）。"
}
---

## 描述

YEARS_ADD 函数用于在指定的日期或时间值上增加（或减少）指定数量的年数，返回调整后的日期或时间。支持处理 DATE、DATETIME 类型，年数可为正数（增加）或负数（减少）。

该函数与 [date_add 函数](./date-add) 和 mysql 中的 [date_add 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) 使用 YEAR 为单位的行为一致

## 语法

```sql
YEARS_ADD(<date_or_time_expr>, <years>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr>` | 输入的日期时间值，支持输入 date/datetime 类型，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)|
| `<years>` | 要增加的年数，类型为 INT,负数表示减少，正数表示增加 |


## 返回值

返回与输入类型一致的结果（DATE 或 DATETIME），表示调整后的日期或时间：

- 若输入为 DATE 类型，返回值仍为 DATE 类型（仅调整年月日）。
- 若输入为 DATETIME 类型，返回值仍为 DATETIME 类型（年月日调整后，时分秒保持不变）。
- <years_value> 为负数时表示减少年数（等价于 YEARS_SUB(<datetime_or_date_value>, <years_value>)）。
- 任意输入参数为 NULL，返回 NULL。
- 若计算结果超出日期类型的有效范围（0000-01-01 00:00:00 至 9999-12-31 23:59:59），返回错误。
- 若调整后月份的天数不足（如 2 月 29 日加 1 年且次年非闰年），自动调整为当月最后一天（如 2020-02-29 加 1 年返回 2021-02-28）。
举例

## 举例

```sql
-- DATETIME类型增加1年（基础功能，时分秒保持不变）
SELECT YEARS_ADD('2020-01-31 02:02:02', 1) AS add_1_year_datetime;
+-----------------------+
| add_1_year_datetime   |
+-----------------------+
| 2021-01-31 02:02:02   |
+-----------------------+

-- DATETIME类型减少1年（负数years_value，跨年度）
SELECT YEARS_ADD('2023-05-10 15:40:20', -1) AS subtract_1_year_datetime;
+--------------------------+
| subtract_1_year_datetime |
+--------------------------+
| 2022-05-10 15:40:20      |
+--------------------------+

-- DATE类型增加3年（仅调整日期）
SELECT YEARS_ADD('2019-12-25', 3) AS add_3_year_date;
+------------------+
| add_3_year_date  |
+------------------+
| 2022-12-25       |
+------------------+

-- 闰日处理（2020-02-29加1年，次年为平年）
SELECT YEARS_ADD('2020-02-29', 1) AS leap_day_adjust;
+------------------+
| leap_day_adjust  |
+------------------+
| 2021-02-28       |
+------------------+

-- 跨月天数调整（1月31日加1年到2月）
SELECT YEARS_ADD('2023-01-31', 1) AS month_day_adjust;
+------------------+
| month_day_adjust |
+------------------+
| 2024-01-31       | 
+------------------+


-- 输入为NULL（返回NULL）
SELECT YEARS_ADD(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- 计算结果超出日期时间范围（上限）
SELECT YEARS_ADD('9999-12-31', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_add of 9999-12-31, 1 out of range

-- 计算结果超出日期时间范围（下限）
SELECT YEARS_ADD('0000-01-01', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_add of 0000-01-01, -1 out of range
```
