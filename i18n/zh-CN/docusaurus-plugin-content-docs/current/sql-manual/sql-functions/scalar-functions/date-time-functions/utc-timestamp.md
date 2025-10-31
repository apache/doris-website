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
UTC_TIMESTAMP([`<precision>`])
```

## 参数

| 参数                         | 描述                          |
|----------------------------|-----------------------------|
| `<precision>` | 返回的时间值的精度，支持[0, 6]范围内的整数类型。仅接受整数类型常量。 |

## 返回值
返回当前 UTC 日期时间.

根据使用场景的不同，返回类型可能为 DATETIME 类型（格式：YYYY-MM-DD HH:mm:ss[.ssssss]）或整数类型（格式：YYYYMMDDHHmmss, 在类型转换时，会自动丢弃毫秒数）。


## 举例

```sql
---当前地区时间为东八区 2025-10-27 14:43:21
SELECT UTC_TIMESTAMP(), UTC_TIMESTAMP() + 0, UTC_TIMESTAMP(5), UTC_TIMESTAMP(5) + 0;
```
```text
+---------------------+---------------------+---------------------------+----------------------+
| UTC_TIMESTAMP()     | UTC_TIMESTAMP() + 0 | UTC_TIMESTAMP(5)          | UTC_TIMESTAMP(5) + 0 |
+---------------------+---------------------+---------------------------+----------------------+
| 2025-10-27 06:43:21 |      20251027064321 | 2025-10-27 06:43:21.88177 |       20251027064321 |
+---------------------+---------------------+---------------------------+----------------------+
```

```sql
SELECT UTC_TIMESTAMP(7);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = scale must be between 0 and 6
```

