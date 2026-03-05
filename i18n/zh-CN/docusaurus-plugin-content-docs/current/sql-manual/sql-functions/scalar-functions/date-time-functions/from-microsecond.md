---
{
    "title": "FROM_MICROSECOND",
    "language": "zh-CN",
    "description": "FROMMICROSECOND 函数用于将 Unix 时间戳（以微秒为单位） 转换为 DATETIME 类型的日期时间值。Unix 时间戳的基准时间为 1970-01-01 00:00:00 UTC，该函数会将输入的微秒数转换为该基准时间之后对应的具体日期和时间（包含秒的小数部分，精确到微秒）。"
}
---

## 描述

FROM_MICROSECOND 函数用于将 Unix 时间戳（以微秒为单位） 转换为 `DATETIME` 类型的日期时间值。Unix 时间戳的基准时间为 1970-01-01 00:00:00 UTC，该函数会将输入的微秒数转换为该基准时间之后对应的具体日期和时间（包含秒的小数部分，精确到微秒）。

## 语法

```sql
FROM_MICROSECOND(<unix_timestamp>)
```

## 参数

| 参数                 | 说明                                                  |
|--------------------|-----------------------------------------------------|
| `<unix_timestamp>` | 	输入的 Unix 时间戳，类型为整数（BIGINT），表示从 1970-01-01 00:00:00 UTC 开始计算的微秒数 |

## 返回值

返回一个 DATETIME 类型的值，表示 UTC 时区下的 unix 时间戳，转换为当前时区的时间的结果
- 如果 <unix_timestamp> 为 NULL，函数返回 NULL。
- 若输入 <unix_timestamp> 能转换为整数秒，那么结果返回日期时间不带有 scale，如果不能，则结果返回带有 scale
- 如果 <unix_timestamp> 小于 0 ，返回错误
- 若 返回日期时间超过最大时间 9999-12-31 23:59:59 ，则返回错误

## 举例

```sql

---当前机器所在时区是东八区，所以返回的时间相较于 UTC 加八个小时
SELECT FROM_MICROSECOND(0);
+----------------------------+
| FROM_MICROSECOND(0)        |
+----------------------------+
| 1970-01-01 08:00:00.000000 |
+----------------------------+

---将 1700000000000000 微秒加在基准时间后转换为的日期时间
SELECT FROM_MICROSECOND(1700000000000000);
+------------------------------------+
| from_microsecond(1700000000000000) |
+------------------------------------+
| 2023-11-15 06:13:20                |
+------------------------------------+

-- 时间戳包含非整数秒（1700000000 秒 + 123456 微秒）
select from_microsecond(1700000000123456) as dt_with_micro;
+----------------------------+
| dt_with_micro              |
+----------------------------+
| 2023-11-15 06:13:20.123456 |
+----------------------------+

---输入负数，返回错误
 select from_microsecond(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_microsecond of -1 out of range

---输入 NULL，返回 NULL
select from_microsecond(NULL);
+------------------------+
| from_microsecond(NULL) |
+------------------------+
| NULL                   |
+------------------------+

---超过最大时间范围 9999-12-31 23:59:59  ，返回错误
select from_microsecond(999999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_microsecond of 999999999999999999 out of range
```