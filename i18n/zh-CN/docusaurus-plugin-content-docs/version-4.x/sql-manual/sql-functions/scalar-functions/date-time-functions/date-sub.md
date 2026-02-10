---
{
    "title": "DATE_SUB",
    "language": "zh-CN",
    "description": "DATE_SUB 函数用于从指定的日期或时间值中减去指定的时间间隔，返回计算后的日期或时间结果。该函数支持对 DATE（仅日期）, DATETIME（日期和时间）TIMESTAMPTZ(带时区偏移量的日期时间)类型进行操作，时间间隔通过数值和单位共同定义。"
}
---

## 描述

DATE_SUB 函数用于从指定的日期或时间值中减去指定的时间间隔，返回计算后的日期或时间结果。该函数支持对 DATE（仅日期）, DATETIME（日期和时间）TIMESTAMPTZ(带时区偏移量的日期时间)类型进行操作，时间间隔通过数值和单位共同定义。

该函数与 mysql 中的 [date_sub 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) 行为一致。

## 别名

- days_sub
- subdate

## 语法

```sql
DATE_SUB(<date_or_time_part>, INTERVAL <expr> <time_unit>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<date_or_time_part>` | 合法的日期值，支持为 timestamptz, datetime 或者 date 类型，具体格式请查看 [timestamptz的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<expr>` | 希望减去的时间间隔，类型为 `INT`, 对于独立单位(如`YEAR`)为 `INT` 类型; 对于复合单位(如`YEAR_MONT`)为字符串类型, 且接受所有非数字作为分隔符，所以对于例如`INTERVAL 6/4 HOUR_MINUTE`，Doris会将其识别为 6 小时 4 分，而非1小时30分(6/4 == 1.5)。对于复合单位, 如果输入的时间间隔值过短，会将空出的大单位的值设为 0。该值的正负性仅由第一个出现的非数字字符是否为`-`决定。|
| `<time_unit>` | 枚举值：YEAR, QUARTER, MONTH, WEEK,DAY, HOUR, MINUTE, SECOND, YEAR_MONTH, DAY_HOUR, DAY_MINUTE, DAY_SECOND, DAY_MICROSECOND, HOUR_MINUTE, HOUR_SECOND, HOUR_MICROSECOND, MINUTE_SECOND, MINUTE_MICROSECOND, SECOND_MICROSECOND。 |


| time_unit          | 预期格式(接受所有非数字作为分隔符)        |
| ------------------ | ----------------------------------------- |
| YEAR               | 'YEARS'                                   |
| QUARTER            | 'QUARTERS'                                |
| MONTH              | 'MONTHS'                                  |
| WEEK               | 'WEEKS'                                   |
| DAY                | 'DAYS'                                    |
| HOUR               | 'HOURS'                                   |
| MINUTE             | 'MINUTES'                                 |
| SECOND             | 'SECONDS'                                 |
| MICROSECOND        | 'MICROSECONDS'                            |
| YEAR_MONTH         | 'YEARS-MONTHS'                            |
| DAY_HOUR           | 'DAYS HOURS'                              |
| DAY_MINUTE         | 'DAYS HOURS:MINUTES'                      |
| DAY_SECOND         | 'DAYS HOURS:MINUTES:SECONDS'              |
| DAY_MICROSECOND    | 'DAYS HOURS:MINUTES:SECONDS.MICROSECONDS' |
| HOUR_MINUTE        | 'HOURS:MINUTES'                           |
| HOUR_SECOND        | 'HOURS:MINUTES:SECONDS'                   |
| HOUR_MICROSECOND   | 'HOURS:MINUTES:SECONDS.MICROSECONDS'      |
| MINUTE_SECOND      | 'MINUTES:SECONDS'                         |
| MINUTE_MICROSECOND | 'MINUTES:SECONDS.MICROSECONDS'            |
| SECOND_MICROSECOND | 'SECONDS.MICROSECONDS'                    |

:::note
复合单位除`MINUTE`, `SECOND`, `DAY_SECOND`, `DAY_HOUR`, `MINUTE_SECOND`, `SECOND_MICROSECOND`, 其余从4.0.4开始支持。
:::

## 返回值

返回与 date 类型一致的计算结果：
- 输入 DATE 类型时，返回 DATE（仅日期部分）；
- 输入 DATETIME 类型时，返回 DATETIME（包含日期和时间）。
- 输入 TIMESTAMPTZ 类型时, 返回 TIMESTAMPTZ（包含日期，时间和时区偏移量）。
- 对于带有 scale 的 datetime 类型，会保留 scale 返回。

特殊情况：
- 任何参数为 NULL 时，返回 NULL；
- 非法单位，返回错误。
- 对于复合单位，如果输入的部分过多或其中某一部分超出允许最大值922337203685477579, 报错。
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

-- TimeStampTz 类型示例，SET time_zone = '+08:00'
SELECT DATE_SUB('2024-02-05 02:03:04.123+12:00', INTERVAL 1 DAY);
+-----------------------------------------------------------+
| DATE_SUB('2024-02-05 02:03:04.123+12:00', INTERVAL 1 DAY) |
+-----------------------------------------------------------+
| 2024-02-03 22:03:04.123+08:00                             |
+-----------------------------------------------------------+

-- 对于复合单位, 接受所有非数字作为分隔符
select DATE_SUB('2025-10-23 10:10:10', INTERVAL '   *1@#$2' DAY_HOUR);
+----------------------------------------------------------------+
| DATE_SUB('2025-10-23 10:10:10', INTERVAL '   *1@#$2' DAY_HOUR) |
+----------------------------------------------------------------+
| 2025-10-22 08:10:10                                            |
+----------------------------------------------------------------+

-- 对于复合单位，时间间隔的正负性仅由第一个出现的非数字字符是否为`-`决定
-- 后续的所有 `-` 会被认为是分隔符的一部分
select 
    DATE_SUB('2025-10-23 10:10:10', INTERVAL '#-1:-1' MINUTE_SECOND) AS first_not_sub,
    DATE_SUB('2025-10-23 10:10:10', INTERVAL '  -1:1' MINUTE_SECOND) AS first_sub;
+---------------------+---------------------+
| first_not_sub       | first_sub           |
+---------------------+---------------------+
| 2025-10-23 10:09:09 | 2025-10-23 10:11:11 |
+---------------------+---------------------+

-- 对于复合单位, 如果输入的时间间隔值过短，会将空出的大单位的值设为 0
select DATE_SUB('2025-10-23 10:10:10', INTERVAL '1' MINUTE_SECOND) AS minute_interval_is_zero
+-------------------------+
| minute_interval_is_zero |
+-------------------------+
| 2025-10-23 10:10:09     |
+-------------------------+

-- 对于复合单位，如果输入时间间隔数量过多，报错
select DATE_SUB('2025-10-23 10:10:10', INTERVAL '1:2:3.4' SECOND_MICROSECOND);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation second_microsecond_add of -1:2:3.4 is invalid

-- 对于复合单位, 如果其中一部分的值超过最大值922337203685477580，报错
select DATE_SUB('2025-10-10 1:2:3', INTERVAL '922337203685477580' DAY_MICROSECOND);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_microsecond_add of 2025-10-10 01:02:03, -922337203685477580 out of range

--非法单位，返回错误
mysql> select date_sub('2022-01-01', INTERVAL 1 Y);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'Y' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 41)

---超出最小日期
mysql> select date_sub('0000-01-01', INTERVAL 1 DAY);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_add of 0000-01-01, -1 out of range

select date_sub('9999-01-01', INTERVAL -1 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_add of 9999-01-01, 1 out of range
```