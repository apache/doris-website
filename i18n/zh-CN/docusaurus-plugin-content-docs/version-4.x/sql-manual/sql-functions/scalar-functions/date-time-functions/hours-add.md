---
{
    "title": "HOURS_ADD",
    "language": "zh-CN",
    "description": "HOURS_ADD 函数用于在输入的日期或日期时间值上增加或减少指定的小时数，并返回计算后的新日期时间。该函数支持 DATE, DATETIME 和 TIMESTAMPTZ 作为输入类型,若输入为 DATE 类型（仅包含年月日），会默认其时间部分为 00:00:00 转换为 DATETIME 类型，再进行小时累加。"
}
---

## 描述

HOURS_ADD 函数用于在输入的日期或日期时间值上增加或减少指定的小时数，并返回计算后的新日期时间。该函数支持 DATE, DATETIME 和 TIMESTAMPTZ 作为输入类型,若输入为 DATE 类型（仅包含年月日），会默认其时间部分为 00:00:00 转换为 DATETIME 类型，再进行小时累加。

该函数与 [date_add 函数](./date-add) 和 mysql 中的 [date_add 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) 使用 `HOUR` 单位的行为一致。

## 语法

```sql
HOURS_ADD(`<date_or_time_expr>`, `<hours>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr>` | 参数是合法的日期表达式，支持输入 date/datetime/timestamptz 类型，具体格式请查看 [timestamptz的转换](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<hours>` | 	要增加的小时数，类型为整数（INT），可正可负：正数：增加指定小时，负数：减少指定小时（等效于减去小时）。 |

## 返回值

返回基准时间`<date_or_time_expr>`加上指定小时`<hours>`的值，返回值类型由第一个参数类型决定:
- 若第一个参数类型为 DATE/DATETIME, 则返回 DATETIME 类型。
- 若第一个参数类型为 TIMESTAMPTZ, 则返回 TIMESTAMPTZ 类型。

特殊情况:
- 若计算结果超出 DATETIME 类型的有效范围 [0000-01-01 00:00:01,9999-12-31 23:59:59]，返回 错误。
- 任意一个参数为 NULL， 返回 NULL

## 举例

```sql

---对 datetime 类型增加小时数
SELECT HOURS_ADD('2020-02-02 02:02:02', 1);
+------------------------------------------------------------+
| hours_add(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+------------------------------------------------------------+
| 2020-02-02 03:02:02                                        |
+------------------------------------------------------------+

---对 date 类型增加小时数，返回 datetime 类型
SELECT HOURS_ADD('2020-02-02', 51);
+-----------------------------+
| HOURS_ADD('2020-02-02', 51) |
+-----------------------------+
| 2020-02-04 03:00:00         |
+-----------------------------+

---增加负数小时（即减少小时）
select hours_add('2023-10-01 10:00:00', -3) ;
+--------------------------------------+
| hours_add('2023-10-01 10:00:00', -3) |
+--------------------------------------+
| 2023-10-01 07:00:00                  |
+--------------------------------------+

-- TimeStampTz 类型示例, SET time_zone = '+08:00'
SELECT HOURS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| HOURS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-10 13:22:33.123+08:00                 |
+-----------------------------------------------+

---输入参数为 NULL,返回 NULL
select hours_add(null, 5) ;
+--------------------+
| hours_add(null, 5) |
+--------------------+
| NULL               |
+--------------------+

select hours_add('2023-10-01 10:00:00',NULL) ;
+---------------------------------------+
| hours_add('2023-10-01 10:00:00',NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

---超出日期时间范围
select hours_add('9999-12-31 23:59:59', 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 9999-12-31 23:59:59, 2 out of range

mysql> select hours_add('0000-01-01',-2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 0000-01-01 00:00:00, -2 out of range
```
