---
{
    "title": "WEEKS_SUB",
    "language": "zh-CN",
    "description": "WEEKSSUB 函数用于在指定的日期或时间值上减少（或增加）指定数量的周数，返回调整后的日期或时间（本质是减去 weeksvalue × 7 天）。支持处理 DATE、DATETIME 类型。"
}
---

## 描述
WEEKS_SUB 函数用于在指定的日期或时间值上减少（或增加）指定数量的周数，返回调整后的日期或时间（本质是减去 weeks_value × 7 天）。支持处理 DATE、DATETIME 类型。

该函数与 [weeks_sub 函数](./weeks-sub) 和 mysql 中的 [weeks_sub 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weeks-sub) 使用 WEEK 为单位的行为一致。

## 语法
```sql
WEEKS_SUB(`<date_or_time_expr>`, `<week_period>`)
```

## 参数
| 参数          | 描述                                                                |
|---------------|-------------------------------------------------------------------|
| `<date_or_time_expr>`  | 输入的日期时间值，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)                                       |
| `week_period` | INT 类型整数，表示要减少的周数（正数表示减少，负数表示增加）。                                     |

## 返回值
返回减少了指定周数的日期或时间：

- 若输入为 DATE 类型，返回值仍为 DATE 类型（仅调整年月日）。
- 若输入为 DATETIME 类型，返回值仍为 DATETIME 类型（年月日调整后，时分秒保持不变）。
- `<weeks_value>` 为负数时表示增加周数（等价于 WEEKS_ADD(`<datetime_or_date_value>`, `<weeks_value>`）。
- 任意输入参数为 NULL，返回 NULL。
- 若计算结果超出日期类型的有效范围（0000-01-01 00:00:00 至 9999-12-31 23:59:59），返回错误。
  
## 举例
```sql
-- DATETIME类型减少1周（基础功能，时分秒保持不变）
SELECT WEEKS_SUB('2023-10-01 08:30:45', 1) AS sub_1_week_datetime;
+---------------------+
| sub_1_week_datetime |
+---------------------+
| 2023-09-24 08:30:45 |
+---------------------+

-- DATETIME类型增加1周（负数weeks_value，跨月）
SELECT WEEKS_SUB('2023-09-24 14:20:10', -1) AS add_1_week_datetime;
+---------------------+
| add_1_week_datetime |
+---------------------+
| 2023-10-01 14:20:10 |
+---------------------+

-- DATE类型减少2周（仅调整日期，无时间部分）
SELECT WEEKS_SUB('2023-06-03', 2) AS sub_2_week_date;
+-----------------+
| sub_2_week_date |
+-----------------+
| 2023-05-20      |
+-----------------+

-- 跨年度减少（1月初减少1周，到上一年12月底）
SELECT WEEKS_SUB('2024-01-01', 1) AS cross_year_sub;
+----------------+
| cross_year_sub |
+----------------+
| 2023-12-25     |
+----------------+

-- 输入为NULL（返回NULL）
SELECT WEEKS_SUB(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- 计算结果超出日期时间范围（下限）
SELECT WEEKS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_add of 0000-01-01, -1 out of range

-- 计算结果超出日期时间范围（上限）
SELECT WEEKS_SUB('9999-12-31', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_add of 9999-12-31, 1 out of range
```