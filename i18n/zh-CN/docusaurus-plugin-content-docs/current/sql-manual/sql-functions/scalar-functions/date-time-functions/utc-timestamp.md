---
{
    "title": "UTC_TIMESTAMP",
    "language": "zh-CN"
}
---

## 描述
UTC_TIMESTAMP 函数用于返回当前 UTC 时区在所的日期时间。该函数不受本地时区影响，始终返回基于 UTC 时区的当前时间，确保跨时区场景下的时间一致性.

该函数与 mysql 中的 [utc_timestamp 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-timestamp) 行为一致。

## 语法

```sql
UTC_TIMESTAMP()
```

## 返回值
返回当前 UTC 日期时间，类型为 DATETIME.

## 举例

```sql

---当前地区时间为东八区 2025-08-14 11：45：42
SELECT UTC_TIMESTAMP() AS utc_str;
+---------------------+
| utc_str             |
+---------------------+
| 2025-08-14 03:45:42 |
+---------------------+
```

