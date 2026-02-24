---
{
    "title": "TIMEDIFF",
    "language": "zh-CN",
    "description": "TIMEDIFF 函数用于计算两个日期时间值之间的差值，并以 TIME 类型返回结果。该函数支持处理 DATETIME、DATE 类型，若输入为 DATE 类型，默认其时间部分为 00:00:00。"
}
---

## 描述

TIMEDIFF 函数用于计算两个日期时间值之间的差值，并以 TIME 类型返回结果。该函数支持处理 DATETIME、DATE 类型，若输入为 DATE 类型，默认其时间部分为 00:00:00。

该函数与 mysql 中的 [timediff 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timediff) 行为一致

## 语法

```sql
TIMEDIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```

## 参数

| 参数              | 说明                          |
|-------------------|-------------------------------|
| `<date_or_time_expr1>`      | 结束的时间或日期时间值,支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)        |
| `<date_or_time_expr2>`    | 开始的时间或日期时间值,支持输入 date/datetime 类型        |

## 返回值
返回一个 `TIME` 类型的值，表示两个输入之间的时间差：
- 当 `<end_datetime>` 晚于 `<start_datetime>` 时，返回正的时间差。
- 当 `<end_datetime>` 早于 `<start_datetime>` 时，返回负的时间差。
- 当 `<end_datetime>` 和 `<start_datetime>` 相等时，返回 `00:00:00`。
- 如果 `<end_datetime>` 或 `<start_datetime>` 为 `NULL`，函数返回 `NULL`。
- 当返回时间差不为整数秒时，返回时间带有 scale.
- 当计算结果超出 time 范围[-838:59:59,838:59:59],返回错误

## 举例

```sql
-- 两个 DATETIME 之间的差值（跨天）
SELECT TIMEDIFF('2024-07-20 16:59:30', '2024-07-11 16:35:21') AS result;
+-----------+
| result    |
+-----------+
| 216:24:09 |
+-----------+

-- 日期时间与日期的差值（日期默认时间为 00:00:00）
SELECT TIMEDIFF('2023-10-05 15:45:00', '2023-10-05') AS result;
+-----------+
| result    |
+-----------+
| 15:45:00  |
+-----------+

-- 结束时间早于起始时间（返回负值）
SELECT TIMEDIFF('2023-01-01 09:00:00', '2023-01-01 10:30:00') AS result;
+------------+
| result     |
+------------+
| -01:30:00  |
+------------+

-- 同一日期的时间差
SELECT TIMEDIFF('2023-12-31 23:59:59', '2023-12-31 23:59:50') AS result;
+-----------+
| result    |
+-----------+
| 00:00:09  |
+-----------+

-- 跨年份的差值
SELECT TIMEDIFF('2024-01-01 00:00:01', '2023-12-31 23:59:59') AS result;
+-----------+
| result    |
+-----------+
| 00:00:02  |
+-----------+

-- 返回时间不是整数秒时，返回时间带有 scale
SELECT TIMEDIFF('2023-07-13 12:34:56.789', '2023-07-13 12:34:50.123') AS result;
+-----------+
| result    |
+-----------+
| 00:00:06  |
+-----------+

---计算结果超出 time 大小范围，返回错误
SELECT TIMEDIFF('2023-07-13 12:34:56.789', '2024-07-13 12:34:50.123') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]The function timediff result of 2023-07-13 12:34:56.789000, 2024-07-13 12:34:50.123000 is out of range

-- 任一参数为 NULL（返回 NULL）
SELECT TIMEDIFF(NULL, '2023-01-01 00:00:00'), TIMEDIFF('2023-01-01 00:00:00', NULL) AS result;
+---------------------------------------+--------+
| timediff(NULL, '2023-01-01 00:00:00') | result |
+---------------------------------------+--------+
| NULL                                  | NULL   |
+---------------------------------------+--------+
```