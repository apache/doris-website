---
{
    "title": "YEAR_OF_WEEK",
    "language": "zh-CN",
    "description": "YEAROFWEEK 函数用于返回指定日期在 ISO 8601 周日历标准下的周年（year of week）。与普通年份不同，ISO 周年以周为单位计算，一年的第一周是包含 1 月 4 日的那一周，且该周必须包含至少 4 天属于当年。 与 year 函数 不同，year 函数只是返回输入日期的年份"
}
---

## 描述

YEAR_OF_WEEK 函数用于返回指定日期在 ISO 8601 周日历标准下的周年（year of week）。与普通年份不同，ISO 周年以周为单位计算，一年的第一周是包含 1 月 4 日的那一周，且该周必须包含至少 4 天属于当年。
与 [year 函数](./year) 不同，year 函数只是返回输入日期的年份

更多详细信息请参见 [ISO周日历](https://zh.wikipedia.org/wiki/ISO%E9%80%B1%E6%97%A5%E6%9B%86)。

## 别名

- `YOW`

## 语法

```sql
YEAR_OF_WEEK(`<date_or_time_expr>`)
YOW(`<date_or_time_expr>`)
```

## 参数

| 参数 | 描述 |
|------|------|
| `<date_or_time_expr>` | 输入的日期时间值，支持输入 date/datetime 类型，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## 返回值

返回 SMALLINT 类型，表示根据 ISO 8601 周日历标准计算的周年。

- 返回值范围为 1-9999
- 若输入为 NULL，返回 NULL
- 若输入为 DATETIME 类型，仅考虑日期部分，忽略时间部分

## 举例

```sql
-- 2005-01-01是星期六，该周从2004-12-27开始，包含2004年的天数较多，属于2004年
SELECT YEAR_OF_WEEK('2005-01-01') AS yow_result;
+------------+
| yow_result |
+------------+
|       2004 |
+------------+

-- 使用别名YOW，结果相同
SELECT YOW('2005-01-01') AS yow_alias_result;
+------------------+
| yow_alias_result |
+------------------+
|             2004 |
+------------------+

-- 2005-01-03是星期一，这一周(2005-01-03至2005-01-09)是2005年第一周
SELECT YEAR_OF_WEEK('2005-01-03') AS yow_result;
+------------+
| yow_result |
+------------+
|       2005 |
+------------+

-- 2023-01-01是星期日，该周从2022-12-26开始，属于2022年最后一周
SELECT YEAR_OF_WEEK('2023-01-01') AS yow_result;
+------------+
| yow_result |
+------------+
|       2022 |
+------------+

-- 2023-01-02是星期一，这一周(2023-01-02至2023-01-08)是2023年第一周
SELECT YEAR_OF_WEEK('2023-01-02') AS yow_result;
+------------+
| yow_result |
+------------+
|       2023 |
+------------+

-- DATETIME类型输入，忽略时间部分
SELECT YEAR_OF_WEEK('2005-01-01 15:30:45') AS yow_datetime;
+--------------+
| yow_datetime |
+--------------+
|         2004 |
+--------------+

-- 跨年边界情况：2024-12-30是星期一，属于2025年第一周
SELECT YEAR_OF_WEEK('2024-12-30') AS yow_result;
+------------+
| yow_result |
+------------+
|       2025 |
+------------+

-- 输入为NULL，返回NULL
SELECT YEAR_OF_WEEK(NULL) AS yow_null;
+----------+
| yow_null |
+----------+
|     NULL |
+----------+
```
