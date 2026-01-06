---
{
    "title": "MICROSECONDS_ADD",
    "language": "zh-CN",
    "description": "MICROSECONDSADD 函数用于向输入的日期时间值中添加指定的微秒数，并返回计算后的新日期时间值。该函数支持处理含微秒精度的 DATETIME 类型。"
}
---

## 描述

MICROSECONDS_ADD 函数用于向输入的日期时间值中添加指定的微秒数，并返回计算后的新日期时间值。该函数支持处理含微秒精度的 DATETIME 类型。


该函数与 mysql 中的 [date_add 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) 使用 MICROSECOND 为单位的行为一致。

## 语法

```sql
MICROSECONDS_ADD(`<datetime>`, `<delta>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<datetime>` | 输入的日期时间值，类型为 DATETIME，具体 datetime 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)  |
| `<delta>` | 要添加的微秒数，类型为 BIGINT，1 秒 = 1,000,000 微秒 |

## 返回值

返回 DATETIME 类型的值，表示基准时间添加指定微秒后的结果（格式为 YYYY-MM-DD HH:MM:SS.ffffff，其中小数部分精度与 datetime 一致）。

- 若 `<delta>` 为负数，函数效果等同于从基准时间中减去对应微秒数（即 MICROSECONDS_ADD(basetime, -n) 等价于 MICROSECONDS_SUB(basetime, n)）。
- 若计算结果超出 DATETIME 类型的有效范围（0000-01-01 00:00:00 至 9999-12-31 23:59:59.999999），抛出异常。
- 若任一参数为 NULL，返回 NULL。

## 举例

```sql

---添加微秒
SELECT NOW(3) AS current_time, MICROSECONDS_ADD(NOW(3), 100000000) AS after_add;
+-------------------------+----------------------------+
| current_time            | after_add                  |
+-------------------------+----------------------------+
| 2025-08-11 14:49:16.368 | 2025-08-11 14:50:56.368000 |
+-------------------------+----------------------------+

---添加微秒为负数，返回减小微妙数的 datetime 日期时间
SELECT MICROSECONDS_ADD('2023-10-01 12:00:00.500000', -300000) AS after_add;
+----------------------------+
| after_add                  |
+----------------------------+
| 2023-10-01 12:00:00.200000 |
+----------------------------+

---输入类型为 date,时间部分自动设置为 00:00:00.000000
SELECT MICROSECONDS_ADD('2023-10-01', -300000);
+-----------------------------------------+
| MICROSECONDS_ADD('2023-10-01', -300000) |
+-----------------------------------------+
| 2023-09-30 23:59:59.700000              |
+-----------------------------------------+

---计算结果超过日期时间范围，报错
SELECT MICROSECONDS_ADD('9999-12-31 23:59:59.999999', 2000000) AS after_add;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation microseconds_add of 9999-12-31 23:59:59.999999, 2000000 out of range

---任意输入参数为 NULL，返回 NULL
SELECT MICROSECONDS_ADD('2023-10-01 12:00:00.500000',NULL);
+-----------------------------------------------------+
| MICROSECONDS_ADD('2023-10-01 12:00:00.500000',NULL) |
+-----------------------------------------------------+
| NULL                                                |
+-----------------------------------------------------+

```