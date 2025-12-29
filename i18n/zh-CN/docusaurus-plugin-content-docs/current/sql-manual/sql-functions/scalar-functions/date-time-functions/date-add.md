---
{
    "title": "DATE_ADD",
    "language": "zh-CN",
    "description": "DATEADD 函数用于向指定的日期或时间值添加指定的时间间隔，并返回计算后的结果。"
}
---

## 描述

DATE_ADD 函数用于向指定的日期或时间值添加指定的时间间隔，并返回计算后的结果。

- 支持的输入日期类型包括 DATE、DATETIME（如 '2023-12-31'、'2023-12-31 23:59:59'）。
- 时间间隔由数值（`expre`）和单位（`time_unit`）共同指定，`expr` 为正数时表示“添加”，为负数时等效于“减去”对应间隔。

## 别名

- days_add
- adddate

## 语法

```sql
DATE_ADD(<date_or_time_expr>, <expr> <time_unit>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<date_or_time_expr>` | 待处理的日期/时间值。支持类型：为 datetime 或者 date 类型，最高有六位秒数的精度（如 2022-12-28 23:59:59.999999），具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion))|
| `<expr>` | 希望添加的时间间隔，为 `INT` 类型|
| `<time_unit>` | 枚举值：YEAR, QUARTER, MONTH, WEEK,DAY, HOUR, MINUTE, SECOND, DAY_SECOND, DAY_HOUR, MINUTE_SECOND, SECOND_MICROSECOND |

## 返回值

返回与 <date_or_time_expr> 类型一致的结果：
- 输入 DATE 类型时，返回 DATE（仅日期部分）；
- 输入 DATETIME 类型，返回 DATETIME（包含日期和时间）；
- 带有 scale 的输入（如 '2024-01-01 12:00:00.123'）会保留 scale，最高六位小数精度。

特殊情况：
- 任何参数为 NULL 时，返回 NULL；
- 非法单位或非数值 expr 时，报错；
- 计算后超出日期类型范围（如 '0000-00-00 23:59:59' 之前，'9999-12-31 23:59:59' 之后）时，返回错误。
- 若是下月不足输入日期的天数，会自动设置为下月最后一天

## 举例

```sql
---添加天数
select date_add(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY);
+-------------------------------------------------+
| date_add('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-12-02 23:59:59                             |
+-------------------------------------------------+

---添加季度
mysql> select DATE_ADD(cast('2023-01-01' as date), INTERVAL 1 QUARTER);
+--------------------------------------------+
| DATE_ADD('2023-01-01', INTERVAL 1 QUARTER) |
+--------------------------------------------+
| 2023-04-01                                 |
+--------------------------------------------+

---添加周数
mysql> select DATE_ADD('2023-01-01', INTERVAL 1 WEEK);
+-----------------------------------------+
| DATE_ADD('2023-01-01', INTERVAL 1 WEEK) |
+-----------------------------------------+
| 2023-01-08                              |
+-----------------------------------------+

---添加月数,因为2023年2月只有28天，所以1月31加一个月返回2月28
mysql> select DATE_ADD('2023-01-31', INTERVAL 1 MONTH);
+------------------------------------------+
| DATE_ADD('2023-01-31', INTERVAL 1 MONTH) |
+------------------------------------------+
| 2023-02-28                               |
+------------------------------------------+

---负数测试
mysql> select DATE_ADD('2019-01-01', INTERVAL -3 DAY);
+-----------------------------------------+
| DATE_ADD('2019-01-01', INTERVAL -3 DAY) |
+-----------------------------------------+
| 2018-12-29                              |
+-----------------------------------------+

---跨年的小时增加
mysql> select DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 HOUR);
+--------------------------------------------------+
| DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 HOUR) |
+--------------------------------------------------+
| 2024-01-01 01:00:00                              |
+--------------------------------------------------+

-- 添加 DAY_SECOND
mysql> select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 1:2:3' DAY_SECOND);
+-------------------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 1:2:3' DAY_SECOND) |
+-------------------------------------------------------------------+
| 2025-10-24 11:12:13                                               |
+-------------------------------------------------------------------+

-- 添加 DAY_HOUR
mysql>  select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 2' DAY_HOUR);
+----------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 2' DAY_HOUR) |
+----------------------------------------------------------+
| 2025-10-24 12:10:10                                      |
+----------------------------------------------------------+

-- 添加 MINUTE_SECOND
mysql> select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1:1' MINUTE_SECOND);
+---------------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1:1' MINUTE_SECOND) |
+---------------------------------------------------------------+
| 2025-10-23 10:11:11                                           |
+---------------------------------------------------------------+

-- 添加 SECOND_MICROSECOND
mysql>  select date_add("2025-10-10 10:10:10.123456", INTERVAL "1.1" SECOND_MICROSECOND);
+---------------------------------------------------------------------------+
| date_add("2025-10-10 10:10:10.123456", INTERVAL "1.1" SECOND_MICROSECOND) |
+---------------------------------------------------------------------------+
| 2025-10-10 10:10:11.223456                                                |
+---------------------------------------------------------------------------+

---非法单位
select DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 sa);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'sa' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 50)

---参数为NULL,返回NULL
mysql> select DATE_ADD(NULL, INTERVAL 1 MONTH);
+----------------------------------+
| DATE_ADD(NULL, INTERVAL 1 MONTH) |
+----------------------------------+
| NULL                             |
+----------------------------------+

---计算出的结果不在日期范围[0000,9999]，返回错误
mysql> select DATE_ADD('0001-01-28', INTERVAL -2 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation years_add of 0001-01-28, -2 out of range

mysql> select DATE_ADD('9999-01-28', INTERVAL 2 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation years_add of 9999-01-28, 2 out of range
```
