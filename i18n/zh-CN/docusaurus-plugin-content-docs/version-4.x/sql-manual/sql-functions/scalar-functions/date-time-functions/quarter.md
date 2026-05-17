---
{
    "title": "QUARTER",
    "language": "zh-CN",
    "description": "函数用于返回指定 日期所属的季度（1 到 4）。每个季度包含三个月："
}
---

## 描述
函数用于返回指定 日期所属的季度（1 到 4）。每个季度包含三个月：
- 第 1 季度：1 月至 3 月
- 第 2 季度：4 月至 6 月
- 第 3 季度：7 月至 9 月
- 第 4 季度：10 月至 12 月

该函数与 mysql 的 [quarter 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_quarter) 行为一致。

## 语法

```sql
QUARTER(`<date_or_time_expr>`)
```

## 参数

| 参数           | 说明                                     |
|--------------|----------------------------------------|
| ``<date_or_time_expr>`` | 输入的日期或日期时间值，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)。 |


## 返回值

- 返回一个 TINYINT，表示输入日期所属的季度，范围为 1 到 4。
- 如果输入值为 NULL，函数返回 NULL。

## 举例

```sql
--- 第 1 季度（1-3 月）
SELECT QUARTER('2025-01-16') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- 包含时间部分（不影响结果）
SELECT QUARTER('2025-01-16 01:11:10') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- 第 2 季度（4-6 月）
SELECT QUARTER('2023-05-20') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

--- 第 3 季度（7-9 月）
SELECT QUARTER('2024-09-30 23:59:59') AS result;
+--------+
| result |
+--------+
|      3 |
+--------+

--- 第 4 季度（10-12 月）
SELECT QUARTER('2022-12-01') AS result;
+--------+
| result |
+--------+
|      4 |
+--------+

--- 输入为 NULL（返回 NULL）
SELECT QUARTER(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```