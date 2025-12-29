---
{
    "title": "HOURS_SUB",
    "language": "zh-CN",
    "description": "HOURSSUB 函数用于从输入的日期或日期时间值中减去指定的小时数，并返回计算后的新日期时间。该函数支持 DATE 和 DATETIME 两种输入类型，若输入为 DATE 类型（仅包含年月日），会默认其时间部分为 00:00:00 转换为 DATETIME 类型。"
}
---

## 描述

HOURS_SUB 函数用于从输入的日期或日期时间值中减去指定的小时数，并返回计算后的新日期时间。该函数支持 DATE 和 DATETIME 两种输入类型，若输入为 DATE 类型（仅包含年月日），会默认其时间部分为 00:00:00 转换为 DATETIME 类型。

该函数与 [date_sub 函数](./date-sub) 和 mysql 中的 [date_sub 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) 使用 `HOUR` 单位的行为一致。

## 语法

```sql
HOURS_SUB(`<date_or_time_expr>`, `<hours>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr>` | 参数是合法的日期表达式，支持输入 date/datetime 类型，具体 datetime,date格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<hours>` | 要减去的小时数，类型为 INT |

## 返回值

返回 DATETIME 类型的值，表示加上或减去指定小时后的日期时间（格式为 YYYY-MM-DD HH:MM:SS）

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
