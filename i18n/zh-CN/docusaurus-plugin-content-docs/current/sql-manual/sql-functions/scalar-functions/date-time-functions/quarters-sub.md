---
{
    "title": "QUARTERS_SUB",
    "language": "zh-CN",
    "description": "QUARTERSSUB 函数用于在指定的日期时间值基础上减去或增加指定的季度数（1 个季度 = 3 个月），并返回计算后的日期时间值。该函数支持处理 DATE、DATETIME 类型，若输入负数则等效于增加对应季度数。"
}
---

## 描述


QUARTERS_SUB 函数用于在指定的日期时间值基础上减去或增加指定的季度数（1 个季度 = 3 个月），并返回计算后的日期时间值。该函数支持处理 DATE、DATETIME 类型，若输入负数则等效于增加对应季度数。

该函数与 [date_sub 函数](./date-sub) 使用 QUARTER 为单位行为一致。

## 语法

```sql
QUARTERS_SUB(`<date_or_time_expr>`, `<quarters>`)
```

## 参数

| 参数                | 说明                                 |
|-------------------|------------------------------------|
| `<date_or_time_expr` | 输入的日期或日期时间值，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)。 |
| ``<quarters>``      | 要增加或减少的季度数，正整数表示增加，负整数表示减少。        |

## 返回值
返回一个日期值，与输入的日期类型一致。

- 若 `<quarters>` 为负数，函数效果等同于向基准时间中增加对应季度数（即 QUARTERS_SUB (date, -n) 等价于 QUARTERS_ADD (date, n)）。
- 若输入为 DATE 类型（仅包含年月日），返回结果仍为 DATE 类型；若输入为 DATETIME 类型，返回结果保留原时间部分（如 '2023-04-01 12:34:56' 减 1 个季度后为 '2023-01-01 12:34:56'）。
- 若输入日期为当月最后一天，且目标月份天数少于该日期，则自动调整为目标月份的最后一天（如 4 月 30 日减 1 个季度（3 个月）为 1 月 31 日）。
- 若计算结果超出日期类型的有效范围（DATE 类型：0000-01-01 至 9999-12-31；DATETIME 类型：0000-01-01 00:00:00 至 9999-12-31 23:59:59），抛出异常。
- 若任一参数为 NULL，返回 NULL。

## 举例

```sql
--- 从 DATE 类型减去季度
SELECT QUARTERS_SUB('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2019-10-31 |
+------------+

--- 从 DATETIME 类型减去季度（保留时间部分）
SELECT QUARTERS_SUB('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2019-10-31 02:02:02 |
+---------------------+

--- 负数季度（等价于加法）
SELECT QUARTERS_SUB('2019-10-31', -1) AS result;
+------------+
| result     |
+------------+
| 2020-01-31 |
+------------+

--- 非月底日期减去季度（直接递减）
SELECT QUARTERS_SUB('2023-07-13 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-13 22:28:18 |
+---------------------+

--- 包含微秒的 DATETIME（保留精度）
SELECT QUARTERS_SUB('2023-10-13 22:28:18.456789', 1) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:28:18.456789 |
+----------------------------+

--- 跨年度减去季度
SELECT QUARTERS_SUB('2024-04-01', 2) AS result;
+------------+
| result     |
+------------+
| 2023-10-01 |
+------------+

--- 输入为 NULL 时返回 NULL
SELECT QUARTERS_SUB(NULL, 1), QUARTERS_SUB('2023-07-13', NULL) AS result;
+-------------------------+--------+
| quarters_sub(NULL, 1)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- 计算结果超出日期范围
SELECT QUARTERS_SUB('0000-04-30', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarters_sub of 0000-04-30, 1 out of range

SELECT QUARTERS_SUB('9999-12-31', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarters_sub of 9999-12-31, -1 out of range
```