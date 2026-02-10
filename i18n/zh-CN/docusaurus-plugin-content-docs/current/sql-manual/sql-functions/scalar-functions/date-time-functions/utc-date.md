---
{
    "title": "UTC_DATE",
    "language": "zh-CN",
    "description": "UTCDATE 函数用于返回当前 UTC 时区的日期。该函数不受本地时区影响，始终返回基于 UTC 时区的当前日期，确保跨时区场景下的日期一致性。"
}
---

## 描述
UTC_DATE 函数用于返回当前 UTC 时区的日期。该函数不受本地时区影响，始终返回基于 UTC 时区的当前日期，确保跨时区场景下的日期一致性。

该函数与 mysql 中的 [utc_date 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-date) 行为一致。

## 语法

```sql
UTC_DATE()
```

## 返回值
返回当前 UTC 日期。

返回 Date 类型（格式：YYYY-MM-DD）。当使用返回结果进行数值运算时，会进行类型转换，返回[整数格式](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion.md#from-date)（格式: YYYYMMDD）。

## 举例

```sql
--- 假设当前地区时间为东八区 2025-10-27 10:55:35
SELECT UTC_DATE(), UTC_DATE() + 0;
```
```text
+------------+----------------+
| UTC_DATE() | UTC_DATE() + 0 |
+------------+----------------+
| 2025-10-27 |       20251027 |
+------------+----------------+
```

