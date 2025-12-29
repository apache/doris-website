---
{
    "title": "YEARS_SUB",
    "language": "zh-CN",
    "description": "YEARSSUB 函数用于在指定的日期或时间值上减少（或增加）指定数量的年数，返回调整后的日期或时间（本质是减去 yearsvalue × 1 年）。支持处理 DATE、DATETIME 类型，年数可为正数（减少）或负数（增加）。"
}
---

## 描述

YEARS_SUB 函数用于在指定的日期或时间值上减少（或增加）指定数量的年数，返回调整后的日期或时间（本质是减去 years_value × 1 年）。支持处理 DATE、DATETIME 类型，年数可为正数（减少）或负数（增加）。

该函数与 [date_sub 函数](./date-sub) 和 mysql 中的 [date_sub 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) 使用 YEAR 为单位的行为一致

## 语法

```sql
YEARS_SUB(<date_or_time_expr>, <years>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr>` | 输入的日期时间值，支持输入 date/datetime 类型，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)|
| `<years>` | 要减少的年数，类型为 INT,整数表示减少，负数表示增加 |

## 返回值

返回与输入类型一致的结果（DATE 或 DATETIME），表示调整后的日期或时间：

- 若输入为 DATE 类型，返回值仍为 DATE 类型（仅调整年月日）。
- 若输入为 DATETIME 类型，返回值仍为 DATETIME 类型（年月日调整后，时分秒保持不变）。
- <years_value> 为负数时表示增加年数（等价于 YEARS_ADD(<datetime_or_date_value>, <years_value>)）。
- 任意输入参数为 NULL，返回 NULL。
- 若计算结果超出日期类型的有效范围（0000-01-01 00:00:00 至 9999-12-31 23:59:59），返回错误。
- 若调整后月份的天数不足（如从润年 2 月 29 日减少 1 年到平年 2 月 28 日），自动调整为当月实际天数。
## 举例

```sql
-- DATETIME类型减少1年（基础功能，时分秒保持不变）
SELECT YEARS_SUB('2020-02-02 02:02:02', 1) AS sub_1_year_datetime;
+-----------------------+
| sub_1_year_datetime   |
+-----------------------+
| 2019-02-02 02:02:02   |
+-----------------------+

--DATETIME类型增加1年（负数years_value，跨年度）
SELECT YEARS_SUB('2022-05-10 15:40:20', -1) AS add_1_year_datetime;
+-----------------------+
| add_1_year_datetime   |
+-----------------------+
| 2023-05-10 15:40:20   |
+-----------------------+

-- DATE类型减少3年（仅调整日期）
SELECT YEARS_SUB('2022-12-25', 3) AS sub_3_year_date;
+------------------+
| sub_3_year_date  |
+------------------+
| 2019-12-25       |
+------------------+

-- 闰日处理（从闰年 2 月 29 日减1年到平年 2 月 28 日）
SELECT YEARS_SUB('2020-02-29', 1) AS leap_day_adjust_1;
+-------------------+
| leap_day_adjust_1 |
+-------------------+
| 2019-02-28        |
+-------------------+

-- 输入为NULL（返回NULL）
SELECT YEARS_SUB(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- 计算结果超出日期时间范围（上限）
SELECT YEARS_SUB('9999-12-31', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_add of 9999-12-31, 1 out of range

--计算结果超出日期时间范围（下限）
SELECT YEARS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_add of 0000-01-01, -1 out of range
