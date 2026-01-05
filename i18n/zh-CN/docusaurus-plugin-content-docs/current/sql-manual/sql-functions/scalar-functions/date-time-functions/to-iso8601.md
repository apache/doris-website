---
{
    "title": "TO_ISO8601",
    "language": "zh-CN",
    "description": "将日期时间值转换为 ISO8601 格式的字符串,支持输入类型为 TIMESTAMPTZ, DATETIME, DATE."
}
---

## 描述

将日期时间值转换为 ISO8601 格式的字符串,支持输入类型为 TIMESTAMPTZ, DATETIME, DATE.

## 语法

```sql
TO_ISO8601(<date_or_time_expr>)
```

## 参数
| 参数                         | 描述                          |
|----------------------------|-----------------------------|
| `<date_or_time_expr>` | 输入的日期时间值，支持输入 date/datetime/timestamptz 类型，具体格式请查看 [timestamptz的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## 返回值

返回类型为 VARCHAR，表示 ISO8601 格式的日期时间字符串。

- 若输入为 DATE （如 '2023-10-05'），返回格式为 YYYY-MM-DD（仅日期）；
- 若输入为 DATETIME （如 '2023-10-05 15:30:25'），返回格式为 YYYY-MM-DDTHH:MM:SS.ssssss；
- 若输入为 TIMESTAMPTZ（如 '2023-10-05 15:30:25+03:00'）返回格式为 YYYY-MM-DDTHH:MM:SS.ssssss±HH:MM（时区偏移信息由会话变量中的`time_zone`决定）；
- 若输入为 NULL，返回 NULL；

## 举例

```sql
-- 转换 DATE 类型（仅日期）
SELECT TO_ISO8601(CAST('2023-10-05' AS DATE)) AS date_result;
+--------------+
| date_result  |
+--------------+
| 2023-10-05   |
+--------------+

--  转换 DATETIME 类型（带时分秒）
SELECT TO_ISO8601('2020-01-01 12:30:45') AS datetime_result;
+----------------------------+
| datetime_result            |
+----------------------------+
| 2020-01-01T12:30:45.000000 |
+----------------------------+

---输入带有 scale ,四舍五入为秒
SELECT TO_ISO8601('2020-01-01 12:30:45.956') AS datetime_result;
+----------------------------+
| datetime_result            |
+----------------------------+
| 2020-01-01T12:30:45.956000 |
+----------------------------+

-- 输入类型为 TimeStampTz
SELECT TO_ISO8601('2025-10-10 11:22:33+03:00');
+-----------------------------------------+
| TO_ISO8601('2025-10-10 11:22:33+03:00') |
+-----------------------------------------+
| 2025-10-10T16:22:33.000000+08:00        |
+-----------------------------------------+

-- 输入为 NULL（返回 NULL）
SELECT TO_ISO8601(NULL) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+
```