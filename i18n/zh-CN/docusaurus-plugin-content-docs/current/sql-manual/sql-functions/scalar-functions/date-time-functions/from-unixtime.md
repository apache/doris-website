---
{
    "title": "FROM_UNIXTIME",
    "language": "zh-CN",
    "description": "FROMUNIXTIME 函数用于将 Unix 时间戳（以秒为单位） 转换为指定格式的日期时间字符串或 VARCHAR 类型值。Unix 时间戳的基准时间为 1970-01-01 00:00:00 UTC，函数会根据输入的时间戳和格式字符串，生成对应的日期时间表示。"
}
---

## 描述

FROM_UNIXTIME 函数用于将 Unix 时间戳（以秒为单位） 转换为指定格式的日期时间字符串或 VARCHAR 类型值。Unix 时间戳的基准时间为 1970-01-01 00:00:00 UTC，函数会根据输入的时间戳和格式字符串，生成对应的日期时间表示。

该函数与 mysql 中的 [from_unixtime 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_from-unixtime) 行为一致

## 语法

```sql
FROM_UNIXTIME(<unix_timestamp> [, <string_format>])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<unix_timestamp>` | 输入的 Unix 时间戳，类型为整数 BIGINT，表示从 1970-01-01 00:00:00 UTC 开始的秒数 |
| `<string_format>` | format 格式，支持类型 varchar 和 string，默认为 %Y-%m-%d %H:%i:%s，具体格式请查看 [date-format](./date-format)|

## 返回值

返回指定格式的日期，类型为 VARCHAR，返回的是 UTC 时区下的时间戳的时间戳转换为当前时区的时间。
- 目前支持的 unix_timestamp 范围为 [0，253402271999] 对应日期为 1970-01-01 00:00:00 至 9999-12-31 23:59:59，超出范围的 unix_timestamp 将返回错误
- 若 string_format 格式无效，返回不符合预期的字符串。
- 若任意参数为 NULL，则返回 NULL
- 如果 string_format 超过 128 字符长度，返回错误

## 举例

```sql

----因为当前时区为东八区，所以返回时间相较于 UTC 会加八个小时
select from_unixtime(0);
+---------------------+
| from_unixtime(0)    |
+---------------------+
| 1970-01-01 08:00:00 |
+---------------------+

---默认格式 %Y-%m-%d %H:%i:%s 返回
mysql> select from_unixtime(1196440219);
+---------------------------+
| from_unixtime(1196440219) |
+---------------------------+
| 2007-12-01 00:30:19       |
+---------------------------+

---指定 yyyy-MM-dd HH:mm:ss 格式返回
mysql> select from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss');
+--------------------------------------------------+
| from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+

---指定 %Y-%m-%d 只有日期格式返回
mysql> select from_unixtime(1196440219, '%Y-%m-%d');
+-----------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d') |
+-----------------------------------------+
| 2007-12-01                              |
+-----------------------------------------+

---指定 %Y-%m-%d %H:%i:%s 格式返回
mysql> select from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s');
+--------------------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+

---超出最大范围， 返回错误
select from_unixtime(253402281999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation from_unixtime_new of 253402281999, yyyy-MM-dd HH:mm:ss is invalid

---输入字符串长度超出限制，报错
select from_unixtime(32536799,repeat('a',129));
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation from_unixtime_new of invalid or oversized format is invalid

---string-format 格式未引用任何时间值
mysql> select from_unixtime(32536799,"gdaskpdp");
+------------------------------------+
| from_unixtime(32536799,"gdaskpdp") |
+------------------------------------+
| gdaskpdp                           |
+------------------------------------+

---输入为 NULL，返回 NULL
mysql> select from_unixtime(NULL);
+---------------------+
| from_unixtime(NULL) |
+---------------------+
| NULL                |
+---------------------+

```