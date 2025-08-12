---
{
    "title": "MONTH",
    "language": "zh-CN"
}
---

## 描述

MONTH 函数用于从日期时间值中提取月份值。返回值范围为 1 到 12，分别代表一年中的 12 个月。该函数支持处理 DATE、DATETIME 类型及符合格式的字符串。

## 语法

```sql
MONTH(<date>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date>` | 输入的日期时间值，支持输入 date/datetime 类型和符合日期时间格式的字符串,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## 返回值

返回类型为 INT，表示月份值：
- 范围：1 到 12
- 1 表示一月，12 表示十二月
- 如果输入为 NULL，返回 NULL

## 举例

```sql
--- 从 DATE 类型中提取月份
SELECT MONTH('1987-01-01') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- 从 DATETIME 类型中提取月份
SELECT MONTH('2023-07-13 22:28:18') AS result;
+--------+
| result |
+--------+
|      7 |
+--------+

--- 从带有小数秒的 DATETIME 中提取月份
SELECT MONTH('2023-12-05 10:15:30.456789') AS result;
+--------+
| result |
+--------+
|     12 |
+--------+

--- 输入为 NULL 时返回 NULL
SELECT MONTH(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
