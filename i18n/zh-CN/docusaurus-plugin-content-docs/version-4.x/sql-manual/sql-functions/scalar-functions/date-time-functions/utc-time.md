---
{
    "title": "UTC_TIME",
    "language": "zh-CN",
    "description": "UTCTIME 函数用于返回当前 UTC 时区的时间。该函数不受本地时区影响，始终返回基于 UTC 时区的当前时间，确保跨时区场景下的时间一致性。"
}
---

## 描述
UTC_TIME 函数用于返回当前 UTC 时区的时间。该函数不受本地时区影响，始终返回基于 UTC 时区的当前时间，确保跨时区场景下的时间一致性。

该函数与 mysql 中的 [utc_time 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-time) 行为一致。

## 语法

```sql
UTC_TIME([<`precision`>])
```

## 参数

| 参数                         | 描述                          |
|----------------------------|-----------------------------|
| `<precision>` | 返回的时间值的精度，支持[0, 6]范围内的整数类型。仅接受整数类型常量。 |

## 返回值

返回当前 UTC 时间。

返回 TIME 类型（格式：HH:mm:ss）。当使用返回结果进行数值运算时，会进行类型转换，返回[整数格式](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from--time)（从 00:00:00 开始经过的时间值，单位为微秒）。

当输入为 NULL 或精度超出范围会报错。

## 举例

```sql
--- 假设当前地区时间为东八区 2025-10-27 14:39:01
SELECT UTC_TIME(), UTC_TIME() + 1, UTC_TIME(6), UTC_TIME(6) + 1;
```
```text
------------+----------------+-----------------+-----------------+
| UTC_TIME() | UTC_TIME() + 1 | UTC_TIME(6)     | UTC_TIME(6) + 1 |
+------------+----------------+-----------------+-----------------+
| 06:39:01   |    23941000001 | 06:39:01.934119 |     23941934120 |
+------------+----------------+-----------------+-----------------+
```

```sql
SELECT UTC_TIME(7);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = scale must be between 0 and 6

SELECT UTC_TIME(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = UTC_TIME argument cannot be NULL.
```