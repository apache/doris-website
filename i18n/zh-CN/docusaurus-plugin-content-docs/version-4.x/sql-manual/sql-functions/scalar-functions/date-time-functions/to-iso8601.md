---
{
    "title": "TO_ISO8601",
    "language": "zh-CN",
    "description": "将日期时间值转换为 ISO8601 格式的字符串,支持输入类型为 DATETIME ,DATE . 返回的的 ISO8601 格式的日期时间表示为 YYYY-MM-DDTHH:MM:SS，T是日期和时间的分隔符"
}
---

## 描述

将日期时间值转换为 ISO8601 格式的字符串,支持输入类型为 DATETIME ,DATE .
返回的的 ISO8601 格式的日期时间表示为 YYYY-MM-DDTHH:MM:SS，T是日期和时间的分隔符

## 语法

```sql
TO_ISO8601(<date_or_time_expr>)
```

## 参数
| 参数                         | 描述                          |
|----------------------------|-----------------------------|
| `<date_or_time_expr>` | 输入的日期时间值，支持输入 date/datetime 类型，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## 返回值

返回类型为 VARCHAR，表示 ISO8601 格式的日期时间字符串。

- 若输入为 DATE （如 '2023-10-05'），返回格式为 YYYY-MM-DD（仅日期）；
- 若输入为 DATETIME （如 '2023-10-05 15:30:25'），返回格式为 YYYY-MM-DDTHH:MM:SS.xxxxxx（日期与时间用 T 分隔,xxxxxx 全为零，输入的 datetime 的小数全部四舍五入为秒）；
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
SELECT TO_ISO8601(CAST('2020-01-01 12:30:45' AS DATETIME)) AS datetime_result;
+----------------------------+
| datetime_result            |
+----------------------------+
| 2020-01-01T12:30:45.000000 |
+----------------------------+

---输入带有 scale ,四舍五入为秒
SELECT TO_ISO8601(CAST('2020-01-01 12:30:45.956' AS DATETIME)) AS datetime_result;
+----------------------------+
| datetime_result            |
+----------------------------+
| 2020-01-01T12:30:46.000000 |
+----------------------------+

-- 输入为 NULL（返回 NULL）
SELECT TO_ISO8601(NULL) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+
```