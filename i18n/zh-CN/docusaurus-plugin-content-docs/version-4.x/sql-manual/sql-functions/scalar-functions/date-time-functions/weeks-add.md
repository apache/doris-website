---
{
    "title": "WEEKS_ADD",
    "language": "zh-CN",
    "description": "WEEKSADD 函数用于在指定的日期或时间值上增加（或减少）指定数量的周数，等价于 在原有日期上 增加/减少 七天，返回调整后的日期或时间。"
}
---

## 描述 

WEEKS_ADD 函数用于在指定的日期或时间值上增加（或减少）指定数量的周数，等价于 在原有日期上 增加/减少 七天，返回调整后的日期或时间。该函数支持 DATE、DATETIME 和 TIMESTAMPTZ 输入类型。

该函数与 [weeks_add 函数](./weeks-sub) 和 mysql 中的 [weeks_add 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weeks-add) 使用 WEEK 为单位的行为一致。

## 语法
```sql
WEEKS_ADD(`<datetime_or_date_expr>`, `<weeks_value>`)
```

## 参数
| 参数                          | 描述                                                                               |
|-------------------------------|-------------------------------------------------------------------------------------|
| `<datetime_or_date_expr>` | 日期时间的输入值，支持输入 date/datetime/timestamptz 类型，具体格式请查看 [timestamptz的转换](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)，[datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)  |
| `<weeks_value>`            | INT 类型整数，表示要增加或减少的周数（正数表示增加，负数表示减少） |


## 返回值

返回增加了指定周数的日期时间，返回值类型由第一个参数的类型决定：

- 若输入为 DATE 类型，返回值为 DATE 类型（仅调整年月日）。
- 若输入为 DATETIME 类型，返回值为 DATETIME 类型（年月日调整后，时分秒保持不变）。
- 若输入为 TIMESTAMPTZ 类型，返回值为 TIMESTAMPTZ 类型（包含日期、时间和时区偏移量）。

特殊情况：
- `<weeks_value>` 为负数时表示减少周数.
- 任意输入参数为 NULL ，返回 NULL
- 若计算结果超出日期类型的有效范围（0000-01-01 00:00:00 至 9999-12-31 23:59:59），返回错误

## 举例
```sql
-- DATETIME类型增加1周（基础功能，时分秒保持不变）
SELECT WEEKS_ADD('2023-10-01 08:30:45', 1) AS add_1_week_datetime;
+---------------------+
| add_1_week_datetime |
+---------------------+
| 2023-10-08 08:30:45 |
+---------------------+

-- DATETIME类型减少1周（负数周数，跨月）
SELECT WEEKS_ADD('2023-10-01 14:20:10', -1) AS subtract_1_week_datetime;
+--------------------------+
| subtract_1_week_datetime |
+--------------------------+
| 2023-09-24 14:20:10      |
+--------------------------+

--DATE类型增加2周（仅调整日期，无时间部分）
 SELECT WEEKS_ADD('2023-05-20', 2) AS add_2_week_date;
+-----------------+
| add_2_week_date |
+-----------------+
| 2023-06-03      |
+-----------------+

-- 跨年度增加（12月底加1周，到下一年1月初）
SELECT WEEKS_ADD('2023-12-25', 1) AS cross_year_add;
+----------------+
| cross_year_add |
+----------------+
| 2024-01-01     |
+----------------+

-- 输入为NULL（返回NULL）
SELECT WEEKS_ADD(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- TimestampTz 类型示例，SET time_zone = '+08:00'
SELECT WEEKS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| WEEKS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-17 12:22:33.123+08:00                 |
+-----------------------------------------------+

---计算结果超出日期时间范围
SELECT WEEKS_ADD('9999-12-31',1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_add of 9999-12-31, 1 out of range

SELECT WEEKS_ADD('0000-01-01',-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_add of 0000-01-01, -1 out of range
```