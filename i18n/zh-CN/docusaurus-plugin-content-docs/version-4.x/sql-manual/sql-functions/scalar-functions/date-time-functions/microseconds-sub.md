---
{
    "title": "MICROSECONDS_SUB",
    "language": "zh-CN",
    "description": "MICROSECONDSSUB 函数用于从输入的日期时间值中减去指定的微秒数，并返回计算后的新日期时间值。该函数支持处理含微秒精度的 DATETIME 类型。"
}
---

## 描述

MICROSECONDS_SUB 函数用于从输入的日期时间值中减去指定的微秒数，并返回计算后的新日期时间值。该函数支持处理含微秒精度的 DATETIME 类型。

该函数与 mysql 中的 [date_sub 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) 使用 MICROSECOND 为单位的行为一致。

## 语法

```sql
MICROSECONDS_SUB(`<datetime>`, `<delta>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<datetime>` | 输入的日期时间值，类型为 DATETIME，具体 datetime 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) |
| `<delta>` | 要减去的微秒数，类型为 BIGINT，1 秒 = 1,000,000 微秒 |

## 返回值

返回 DATETIME 类型的值，表示基准时间减去指定微秒后的结果。

- 若 `<delta>` 为负数，函数效果等同于向基准时间中添加对应微秒数（即 MICROSECONDS_SUB(basetime, -n) 等价于 MICROSECONDS_ADD(basetime, n)）。
- 若计算结果超出 DATETIME 类型的有效范围（0000-01-01 00:00:00 至 9999-12-31 23:59:59.999999），抛出异常。
- 若任一参数为 NULL，返回 NULL。

## 举例

```sql

---减去微秒
SELECT NOW(3) AS current_time, MICROSECONDS_SUB(NOW(3), 100000) AS after_sub;
+-------------------------+----------------------------+
| current_time            | after_sub                  |
+-------------------------+----------------------------+
| 2025-01-16 11:52:22.296 | 2025-01-16 11:52:22.196000 |
+-------------------------+----------------------------+

--- delta 为负数（等价于加法）
mysql> SELECT MICROSECONDS_SUB('2023-10-01 12:00:00.200000', -300000) AS after_sub;
+----------------------------+
| after_sub                  |
+----------------------------+
| 2023-10-01 12:00:00.500000 |
+----------------------------+

--- 任一参数为 NULL，返回 NULL
SELECT MICROSECONDS_SUB(NULL, 1000), MICROSECONDS_SUB('2023-01-01', NULL) AS after_sub;
+------------------------------+----------------------------+
| microseconds_sub(NULL, 1000) | after_sub                  |
+------------------------------+----------------------------+
| NULL                         | NULL                       |
+------------------------------+----------------------------+

---输入类型为 date ,时间部分自动设置为 00:00:00.000000
SELECT MICROSECONDS_SUB('2023-10-01', -300000);
+-----------------------------------------+
| MICROSECONDS_SUB('2023-10-01', -300000) |
+-----------------------------------------+
| 2023-10-01 00:00:00.300000              |
+-----------------------------------------+

---超出日期时间范围，抛出错误
mysql> SELECT MICROSECONDS_SUB('0000-01-01 00:00:00.000000', 1000000) AS after_sub;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation microseconds_add of 0000-01-01 00:00:00, -1000000 
out of range

```