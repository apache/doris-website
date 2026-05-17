---
{
    "title": "MINUTE",
    "language": "zh-CN",
    "description": "MINUTE 函数用于从输入的日期时间值中提取分钟部分的值，返回范围为 0 到 59 的整数。该函数支持处理 DATE、DATETIME、TIME 类型。"
}
---

## 描述

MINUTE 函数用于从输入的日期时间值中提取分钟部分的值，返回范围为 0 到 59 的整数。该函数支持处理 DATE、DATETIME、TIME 类型。

该函数与 mysql 的 [minute 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_minute) 行为一致。

## 语法

```sql
MINUTE(`<date_or_time_expr>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| ``<date_or_time_expr>`` | 输入的日期时间值，类型可以是 DATE、DATETIME,TIME，具体 datetime/date/time 请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion),[time 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/time-conversion) |

## 返回值

返回 INT 类型的整数，表示输入日期时间中的分钟值，取值范围为 0-59。

- 若输入为 DATE 类型（仅包含年月日），默认时间部分为 00:00:00，因此返回 0。
- 若输入为 NULL，返回 NULL。

## 举例

```sql
--- 从 DATETIME 中提取分钟
SELECT MINUTE('2018-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
|     59 |
+--------+

--- 从含微秒的 DATETIME 中提取分钟（忽略微秒）
SELECT MINUTE('2023-05-01 10:05:30.123456') AS result;
+--------+
| result |
+--------+
|      5 |
+--------+

--- 不会主动将字符串转换为 time 类型，返回 NULL
SELECT MINUTE('14:25:45') AS result;
+--------+
| result |
+--------+
|   NULL |
+--------+

--- 从 DATE 类型中提取分钟（默认时间 00:00:00）
SELECT MINUTE('2023-07-13') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- 输入为 NULL，返回 NULL
SELECT MINUTE(NULL) AS result;
+-------------+
| minute(NULL) |
+-------------+
|        NULL |
+-------------+
```
