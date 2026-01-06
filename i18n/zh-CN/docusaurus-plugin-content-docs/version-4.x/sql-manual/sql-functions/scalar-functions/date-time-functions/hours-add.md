---
{
    "title": "HOURS_ADD",
    "language": "zh-CN",
    "description": "HOURSADD 函数用于在输入的日期或日期时间值上增加或减少指定的小时数，并返回计算后的新日期时间。该函数支持 DATE 和 DATETIME 两种输入类型,若输入为 DATE 类型（仅包含年月日），会默认其时间部分为 00:00:00 转换为 DATETIME 类型，再进行小时累加。"
}
---

## 描述

HOURS_ADD 函数用于在输入的日期或日期时间值上增加或减少指定的小时数，并返回计算后的新日期时间。该函数支持 DATE 和 DATETIME 两种输入类型,若输入为 DATE 类型（仅包含年月日），会默认其时间部分为 00:00:00 转换为 DATETIME 类型，再进行小时累加。

该函数与 [date_add 函数](./date-add) 和 mysql 中的 [date_add 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) 使用 `HOUR` 单位的行为一致。

## 语法

```sql
HOURS_ADD(`<date_or_time_expr>`, `<hours>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr>` | 参数是合法的日期表达式，支持输入 date/datetime 类型，具体 datetime,date格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<hours>` | 	要增加的小时数，类型为整数（INT），可正可负：正数：增加指定小时，负数：减少指定小时（等效于减去小时）。 |

## 返回值

返回类型为 DATETIME，返回以输入日期时间为基准，增加或减小指定小时数后的时间值。

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
