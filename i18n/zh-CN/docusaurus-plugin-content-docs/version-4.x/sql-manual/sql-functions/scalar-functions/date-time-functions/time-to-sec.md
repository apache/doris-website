---
{
    "title": "TIME_TO_SEC",
    "language": "zh-CN",
    "description": "TIMETOSEC 函数用于将输入的时间值转换为以秒为单位的总秒数。该函数支持处理 TIME、DATETIME 类型：若输入为 DATETIME 类型，会自动提取其中的时间部分（HH:MM:SS）进行计算；若输入为纯时间值，则直接转换为总秒数。"
}
---

## 描述
TIME_TO_SEC 函数用于将输入的时间值转换为以秒为单位的总秒数。该函数支持处理 TIME、DATETIME 类型：若输入为 DATETIME 类型，会自动提取其中的时间部分（HH:MM:SS）进行计算；若输入为纯时间值，则直接转换为总秒数。

该函数与 mysql 中的 [time_to_sec 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_time-to-sec).

## 语法

```sql
TIME_TO_SEC(<date_or_time_expr>)
```

## 参数

| 参数       | 说明                                                          |
|----------|-------------------------------------------------------------|
| `<date_or_time_expr>` | 必填，支持 TIME 或 DATETIME。如果输入为 DATETIME 类型，函数会提取时间部分进行计算。具体 datetime/time 请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)， [time 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/time-conversion)|

## 返回值
返回类型为 INT，表示输入时间值对应的总秒数，计算逻辑为：小时×3600 + 分钟×60 + 秒。

- 输入 datetime 字符串时必须显示转换为 datetime 类型，不然会默认转换为 time 类型，返回 NULL.
- 若输入为负数时间（如 -01:30:00），返回对应的负秒数（如 -5400）；
- 若输入为 NULL，返回 NULL；
- 忽略微秒部分（如 12:34:56.789 仅按 12:34:56 计算）

## 举例

```sql
-- 纯时间类型
SELECT TIME_TO_SEC('16:32:18') AS result;
+--------+
| result |
+--------+
|  59538 |
+--------+

-- 处理 DATETIME 字符串，返回 NULL
SELECT TIME_TO_SEC('2025-01-01 16:32:18') AS result;
+--------+
| result |
+--------+
|   NULL |
+--------+

-- datetime 字符串需要显示转换为 datetime 类型
SELECT TIME_TO_SEC(cast('2025-01-01 16:32:18' as datetime)) AS result;
+--------+
| result |
+--------+
|  59538 |
+--------+

-- 负数时间转换
SELECT TIME_TO_SEC('-02:30:00') AS result;
+--------+
| result |
+--------+
|  -9000 |
+--------+

-- 负数时间带微秒（忽略微秒）
SELECT TIME_TO_SEC('-16:32:18.99') AS result;
+--------+
| result |
+--------+
| -59538 |
+--------+

-- 微秒处理（忽略微秒）
SELECT TIME_TO_SEC('10:15:30.123456') AS result;
+--------+
| result |
+--------+
|  36930 |
+--------+

-- 无效时间
SELECT TIME_TO_SEC('12:60:00') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- 超出 TIME 范围
SELECT TIME_TO_SEC('839:00:00') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- 参数为 NULL
SELECT TIME_TO_SEC(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```