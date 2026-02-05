---
{
    "title": "SECOND",
    "language": "zh-CN",
    "description": "SECOND 函数用于提取取指定日期时间值中的秒数部分，返回结果为 0 到 59 的整数。该函数支持处理 DATE、DATETIME、TIME 类型，"
}
---

## 描述
SECOND 函数用于提取取指定日期时间值中的秒数部分，返回结果为 0 到 59 的整数。该函数支持处理 DATE、DATETIME、TIME 类型，

该函数与 mysql 中的 [second 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_second) 行为一致
## 语法

```sql
SECOND(<date_or_time_expr>)
```

## 参数

| 参数           | 说明                                 |
|--------------|------------------------------------|
| `<date_or_time_expr>` | 输入的日期时间值，类型可以是 DATE、DATETIME、或 TIME ，具体 datetime/date/time 请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion),[time 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/time-conversion) |

## 返回值
返回类型为 INT，表示输入日期时间中的秒数部分：

- 范围：0 到 59（包含边界值）
- 若输入为 DATE 类型，返回 0（因默认时间为 00:00:00）
- 若输入为 NULL，返回 NULL
- 忽略微秒部分（如 12:34:56.789 仅提取 56 秒）

## 举例
```sql

--- 提取 DATETIME 中的秒数
SELECT SECOND('2018-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
|     59 |
+--------+

--- 输入为 TIME 类型
SELECT SECOND(cast('15:42:33' as time)) AS result;
+--------+
| result |
+--------+
|     33 |
+--------+

--- 输入为 DATE 类型（默认秒数为 0）
SELECT SECOND('2023-07-13') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- 包含微秒的时间（忽略微秒）
SELECT SECOND('2023-07-13 10:30:25.123456') AS result;
+--------+
| result |
+--------+
|     25 |
+--------+

--- 秒数为 0 的情况
SELECT SECOND('2024-01-01 00:00:00') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- 输入情况为  datetime/time 类型都适用的字符串，则优先选择 time 类型
SELECT SECOND("22:12:12");
+--------------------+
| SECOND("22:12:12") |
+--------------------+
|                 12 |
+--------------------+

--- 输入为 NULL（返回 NULL）
SELECT SECOND(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

```