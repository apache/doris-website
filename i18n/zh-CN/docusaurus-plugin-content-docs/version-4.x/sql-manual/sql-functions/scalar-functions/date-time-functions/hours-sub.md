---
{
    "title": "HOURS_SUB",
    "language": "zh-CN",
    "description": "HOURS_SUB 函数用于从输入的日期或日期时间值中减去指定的小时数，并返回计算后的新日期时间。该函数支持 DATE, DATETIME 和 TIMESTAMPTZ 作为输入类型，若输入为 DATE 类型（仅包含年月日），会默认其时间部分为 00:00:00 转换为 DATETIME 类型。"
}
---

## 描述

HOURS_SUB 函数用于从输入的日期或日期时间值中减去指定的小时数，并返回计算后的新日期时间。该函数支持 DATE, DATETIME 和 TIMESTAMPTZ 作为输入类型，若输入为 DATE 类型（仅包含年月日），会默认其时间部分为 00:00:00 转换为 DATETIME 类型。

该函数与 [date_sub 函数](./date-sub) 和 mysql 中的 [date_sub 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) 使用 `HOUR` 单位的行为一致。

## 语法

```sql
HOURS_SUB(`<date_or_time_expr>`, `<hours>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr>` | 参数是合法的日期表达式，支持输入 date/datetime/timestamptz 类型，具体格式请查看 [timestamptz的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<hours>` | 要减去的小时数，类型为 INT |

## 返回值

返回基准时间`<date_or_time_expr>`减去指定小时`<hours>`的值，返回值类型由第一个参数类型决定:
- 若第一个参数类型为 DATE/DATETIME, 则返回 DATETIME 类型。
- 若第一个参数类型为 TIMESTAMPTZ, 则返回 TIMESTAMPTZ 类型。

特殊情况:
- 若计算结果超出 DATETIME 类型的有效范围（0000-01-01 00:00:00 至 9999-12-31 23:59:59），返回错误。
- 输入任一参数为 NULL，返回 NULL
- 输入 hours 为负数，返回日期时间加上对应小时数

## 举例

```sql

---减去正小时数
SELECT HOURS_SUB('2020-02-02 02:02:02', 1);
+------------------------------------------------------------+
| hours_sub(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+------------------------------------------------------------+
| 2020-02-02 01:02:02                                        |
+------------------------------------------------------------+

---date 类型减去小时数， 返回 datetime 类型
select hours_sub('2023-10-01', 12);
+-----------------------------+
| hours_sub('2023-10-01', 12) |
+-----------------------------+
| 2023-09-30 12:00:00         |
+-----------------------------+

---输入 hours 为负数，返回加上小时的日期时间
select hours_sub('2023-10-01 10:00:00', -3);
+--------------------------------------+
| hours_sub('2023-10-01 10:00:00', -3) |
+--------------------------------------+
| 2023-10-01 13:00:00                  |
+--------------------------------------+

-- TimeStampTz 类型示例, SET time_zone = '+08:00'
SELECT HOURS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| HOURS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-10 11:22:33.123+08:00                 |
+-----------------------------------------------+

---任意参数为 NULL ,返回 NULL
select hours_sub('2023-10-01 10:00:00', NULL);
+----------------------------------------+
| hours_sub('2023-10-01 10:00:00', NULL) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+

---超出日期时间范围，返回 NULL
mysql> select hours_sub('9999-12-31 12:00:00', -20);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 9999-12-31 12:00:00, 20 out of range

mysql> select hours_sub('0000-01-01 12:00:00', 20);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 0000-01-01 12:00:00, -20 out of range
```
