---
{
    "title": "FROM_SECOND",
    "language": "zh-CN",
    "description": "FROMSECOND 函数用于将 Unix 时间戳（以秒为单位） 转换为 DATETIME 类型的日期时间值。Unix 时间戳的基准时间为 1970-01-01 00:00:00 UTC，该函数会将输入的秒数转换为该基准时间之后对应的具体日期和时间（精确到秒）。"
}
---

## 描述
FROM_SECOND 函数用于将 Unix 时间戳（以秒为单位） 转换为 DATETIME 类型的日期时间值。Unix 时间戳的基准时间为 1970-01-01 00:00:00 UTC，该函数会将输入的秒数转换为该基准时间之后对应的具体日期和时间（精确到秒）。

## 语法

```sql
FROM_SECOND(<unix_timestamp>)
```

## 参数

| 参数                 | 说明                                                 |
|--------------------|----------------------------------------------------|
| `<unix_timestamp>` | 输入的 Unix 时间戳，类型为整数（BIGINT），表示从 1970-01-01 00:00:00 UTC 开始计算的秒数。 |

## 返回值

- 返回一个 DATETIME 类型的值，表示输入的 UTC 时区下的 unix 时间戳，转换为当前时区的时间的结果
- 如果 <unix_timestamp> 为 NULL，函数返回 NULL。
- 如果 <unix_timestamp> 超出有效范围( 结果日期时间超过了 9999-12-31 23:59:59 ) ，函数返回错误。
- 输入秒数为负数，函数返回错误

## 举例

```sql

----因为当前机器所在时区为东八区，所以返回的时间相较于 UTC 会加八个小时
 SELECT FROM_SECOND(0);
+---------------------+
| FROM_SECOND(0)      |
+---------------------+
| 1970-01-01 08:00:00 |
+---------------------+

---将 1700000000 秒转换为日期时间
SELECT FROM_SECOND(1700000000);
+-------------------------+
| from_second(1700000000) |
+-------------------------+
| 2023-11-15 06:13:20     |
+-------------------------+

---结果超过了最大日期范围，返回错误
select from_second(999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INTERNAL_ERROR]The function from_second Argument value is out of DateTime range

---输入参数为 NULL, 返回 NULL
select from_second(NULL);
+-------------------+
| from_second(NULL) |
+-------------------+
| NULL              |
+-------------------+

--输入参数为负数，结果返回错误
 select from_second(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_second of -1 out of range
```
