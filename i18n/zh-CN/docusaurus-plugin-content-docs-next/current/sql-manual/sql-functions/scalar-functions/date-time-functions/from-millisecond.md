---
{
    "title": "FROM_MILLISECOND",
    "language": "zh-CN",
    "description": "FROMMILLISECOND 函数用于将 Unix 时间戳（以毫秒为单位） 转换为 DATETIME 类型的日期时间值。Unix 时间戳的基准时间为 1970-01-01 00:00:00 UTC，该函数会将输入的毫秒数转换为该基准时间之后对应的具体日期和时间（精确到毫秒）。"
}
---

## 描述

FROM_MILLISECOND 函数用于将 Unix 时间戳（以毫秒为单位） 转换为 DATETIME 类型的日期时间值。Unix 时间戳的基准时间为 1970-01-01 00:00:00 UTC，该函数会将输入的毫秒数转换为该基准时间之后对应的具体日期和时间（精确到毫秒）。

## 语法

```sql
FROM_MILLISECOND(<millisecond>)
```

## 参数

| 参数              | 说明                                                  |
|-----------------|-----------------------------------------------------|
| `<millisecond>` | 输入的 Unix 时间戳，类型为整数（BIGINT），表示从 1970-01-01 00:00:00 UTC 开始计算的毫秒数。 |

## 返回值

返回一个 DATETIME 类型的值，表示输入的 UTC 时区下的 unix 时间戳，转换为当前时区的时间的结果
- 如果 millisecond 为 NULL，函数返回 NULL。
- 如果 millisecond 超出有效范围 ( 结果日期时间超过了 9999-12-31 23:59:59 ) ，函数返回错误。
- 若输入 millisecond 能转换为整数秒，那么结果返回日期时间不带有 scale，如果不能，则结果返回带有 scale
- 输入为负数，结果返回错误

## 举例

```sql

----因为当前机器所在时区为东八区，所以返回的时间相较于 UTC 会加八个小时
SELECT FROM_MILLISECOND(0);
+-------------------------+
| FROM_MILLISECOND(0)     |
+-------------------------+
| 1970-01-01 08:00:00.000 |
+-------------------------+

-- 将 1700000000000 毫秒转换为日期时间
SELECT FROM_MILLISECOND(1700000000000);

+---------------------------------+
| from_millisecond(1700000000000) |
+---------------------------------+
| 2023-11-15 06:13:20             |
+---------------------------------+

-- 时间戳包含非零毫秒（1700000000 秒 + 123 毫秒）
select from_millisecond(1700000000123) as dt_with_milli;
+----------------------------+
| dt_with_milli              |
+----------------------------+
| 2023-11-15 06:13:20.123000 |
+----------------------------+

---输入为 NULL ，结果返回 NULL
select from_millisecond(NULL);
+------------------------+
| from_millisecond(NULL) |
+------------------------+
| NULL                   |
+------------------------+

---输入为负数，结果返回错误
 select from_millisecond(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_millisecond of -1 out of range

--结果超过最大日期，返回错误
select from_millisecond(999999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_millisecond of 999999999999999999 out of range
```