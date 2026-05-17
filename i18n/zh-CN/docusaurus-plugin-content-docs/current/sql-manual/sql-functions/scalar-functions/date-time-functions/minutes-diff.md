---
{
    "title": "MINUTES_DIFF",
    "language": "zh-CN",
    "description": "MINUTESDIFF 函数用于计算两个日期时间值之间的分钟差值，结果为结束时间减去开始时间的分钟数。该函数支持处理 DATE、DATETIME（含微秒精度）类型。"
}
---

## 描述

MINUTES_DIFF 函数用于计算两个日期时间值之间的分钟差值，结果为结束时间减去开始时间的分钟数。该函数支持处理 DATE、DATETIME（含微秒精度）类型。

## 语法

```sql
MINUTES_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| ``<date_or_time_expr1>`` | 结束时间，类型可以是 DATE、DATETIME ，具体 datetime/date 请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| ``<date_or_time_expr1>`` | 开始时间，类型可以是 DATE、DATETIME ，具体 datetime/date 请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## 返回值

返回 INT 类型的整数，表示 `<date_or_time_expr1>` 与 `<date_or_time_expr2>` 之间的分钟差值（1 小时 = 60 分钟）。

- 若 `<date_or_time_expr1>`晚于 `<date_or_time_expr2>`，返回正数。
- 若 `<date_or_time_expr1>` 早于 `<date_or_time_expr2>`，返回负数。
- 计算时会计算真实差距，不会忽略秒，微秒。
- 若输入为 DATE 类型（仅包含年月日），默认其时间部分为 00:00:00。
- 若输入的日期时间包含 scale ,秒或毫秒部分不为零，计算时不会忽略。
- 若任一参数为 NULL，返回 NULL。

## 举例

```sql
--- 结束时间大于开始时间的分钟差
SELECT MINUTES_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00') AS result;
+--------+
| result |
+--------+
|     60 |
+--------+

--- 包含 scale ，计算时不会忽略
SELECT MINUTES_DIFF('2020-12-25 21:00:00.999', '2020-12-25 22:00:00.923');
+--------------------------------------------------------------------+
| MINUTES_DIFF('2020-12-25 21:00:00.999', '2020-12-25 22:00:00.923') |
+--------------------------------------------------------------------+
|                                                                -59 |
+--------------------------------------------------------------------+

--- 结束时间早于开始时间，返回负数
 SELECT MINUTES_DIFF('2023-07-13 21:50:00', '2023-07-13 22:00:00') AS result;
+--------+
| result |
+--------+
|    -10 |
+--------+

--- 输入为 DATE 类型（默认时间 00:00:00）
SELECT MINUTES_DIFF('2023-07-14', '2023-07-13') AS result;
+--------+
| result |
+--------+
|   1440 |
+--------+

--- 两个时间的秒数不相同，也会把秒数计算入内
SELECT MINUTES_DIFF('2023-07-13 22:30:59', '2023-07-13 22:31:01') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- 任一参数为 NULL，返回 NULL
SELECT MINUTES_DIFF(NULL, '2023-07-13 22:00:00'), MINUTES_DIFF('2023-07-13 22:00:00', NULL) AS result;
+-------------------------------------------+--------+
| MINUTES_DIFF(NULL, '2023-07-13 22:00:00') | result |
+-------------------------------------------+--------+
|                                      NULL |   NULL |
+-------------------------------------------+--------+
```
