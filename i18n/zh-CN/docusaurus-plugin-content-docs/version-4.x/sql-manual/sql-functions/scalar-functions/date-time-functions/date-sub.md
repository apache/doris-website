---
{
    "title": "DATE_SUB",
    "language": "zh-CN",
    "description": "DATESUB 函数用于从指定的日期或时间值中减去指定的时间间隔，返回计算后的日期或时间结果。该函数支持对 DATE（仅日期）和 DATETIME（日期和时间）类型进行操作，时间间隔通过数值和单位共同定义。"
}
---

## 描述

DATE_SUB 函数用于从指定的日期或时间值中减去指定的时间间隔，返回计算后的日期或时间结果。该函数支持对 DATE（仅日期）和 DATETIME（日期和时间）类型进行操作，时间间隔通过数值和单位共同定义。

该函数与 mysql 中的 [date_sub 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) 行为大致一致，但不同的是，mysql 支持联合单位的增减，如:

```sql
SELECT DATE_SUB('2025-01-01 00:00:00',INTERVAL '1 1:1:1' DAY_SECOND);
        -> '2024-12-30 22:58:59'
```
doris 不支持这种输入。

## 别名

- days_sub
- subdate

## 语法

```sql
DATE_ADD(<date_or_time_part>, <expr> <time_unit>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<date_or_time_part>` | 合法的日期值，支持为 datetime 或者 date 类型，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)) |
| `<expr>` | 希望减去的时间间隔，类型为 `INT` |
| `<time_unit>` | 枚举值：YEAR，QUARTER，MONTH，WEEK，DAY，HOUR，MINUTE，SECOND |

## 返回值

返回与 date 类型一致的计算结果：
- 输入 DATE 类型时，返回 DATE（仅日期部分）；
- 输入 DATETIME 类型时，返回 DATETIME（包含日期和时间）。
- 对于带有 scale 的 datetime 类型，会保留 scale 返回。

特殊情况：
- 任何参数为 NULL 时，返回 NULL；
- 非法单位，返回错误。
- 计算结果早于日期类型支持的最小值（如 '0000-01-01' 之前），返回错误。

## 举例

```sql

---减去两天
mysql> select date_sub(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY);
+-------------------------------------------------------------------+
| date_sub(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY) |
+-------------------------------------------------------------------+
| 2010-11-28 23:59:59                                               |
+-------------------------------------------------------------------+

---带有 scale 的 参数，返回保留 scale
mysql> select date_sub('2010-11-30 23:59:59.6', INTERVAL 4 SECOND);
+------------------------------------------------------+
| date_sub('2010-11-30 23:59:59.6', INTERVAL 4 SECOND) |
+------------------------------------------------------+
| 2010-11-30 23:59:55.6                                |
+------------------------------------------------------+

---跨年减去两个月
mysql> select date_sub(cast('2023-01-15' as date), INTERVAL 2 MONTH);
+--------------------------------------------------------+
| date_sub(cast('2023-01-15' as date), INTERVAL 2 MONTH) |
+--------------------------------------------------------+
| 2022-11-15                                             |
+--------------------------------------------------------+

---2023 年 2 月 只有 28 天，所以 2023-3-31 减去一个月为 2023-2-28
mysql> select date_sub('2023-03-31', INTERVAL 1 MONTH);
+------------------------------------------+
| date_sub('2023-03-31', INTERVAL 1 MONTH) |
+------------------------------------------+
| 2023-02-28                               |
+------------------------------------------+

---减去 61 秒
mysql> select date_sub('2023-12-31 23:59:59', INTERVAL 61 SECOND);
+-----------------------------------------------------+
| date_sub('2023-12-31 23:59:59', INTERVAL 61 SECOND) |
+-----------------------------------------------------+
| 2023-12-31 23:58:58                                 |
+-----------------------------------------------------+

---季度相减
mysql> select date_sub('2023-12-31 23:59:59', INTERVAL 61 QUARTER);
+------------------------------------------------------+
| date_sub('2023-12-31 23:59:59', INTERVAL 61 QUARTER) |
+------------------------------------------------------+
| 2008-09-30 23:59:59                                  |
+------------------------------------------------------+

---任一参数为 NULL
mysql> select date_sub('2023-01-01', INTERVAL NULL DAY);
+-------------------------------------------+
| date_sub('2023-01-01', INTERVAL NULL DAY) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+

--非法单位，返回粗我
mysql> select date_sub('2022-01-01', INTERVAL 1 Y);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'Y' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 41)

---超出最小日期
mysql> select date_sub('0000-01-01', INTERVAL 1 DAY);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_add of 0000-01-01, -1 out of range

select date_sub('9999-01-01', INTERVAL -1 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_add of 9999-01-01, 1 out of range
```