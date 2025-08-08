---
{
    "title": "DATE_FLOOR",
    "language": "zh-CN"
}
---

## 描述

DATE_FLOOR 函数用于将指定的日期或时间值向下取整（floor）到最近的指定时间间隔周期的起点。即返回不大于输入日期时间的最大周期时刻，周期规则由 `period`（周期数量）和 `type`（周期单位）共同定义，所有周期均以固定起点 0001-01-01 00:00:00 为基准计算。

## 语法

`DATE_FLOOR(<datetime>, INTERVAL <period> <type>)`

## 参数

| 参数 | 说明 |
| -- | -- |
| `datetime` | 参数是合法的日期表达式，类型为 为 `datetime` 或者 `date` 类型和符合格式的字符串类型 |
| `period` | 参数是指定每个周期有多少个单位组成,为 `INT` 类型，开始的时间起点为 0001-01-01T00:00:00 |
| `type` | 参数可以是：YEAR, MONTH, DAY, HOUR, MINUTE, SECOND,WEEK |

## 返回值

返回一个日期按照 period 周期向下取整的结果，类型和 `datetime` 保持一致
若输入有效，返回与 `datetime` 类型一致的取整结果：
- 输入 DATE 时，返回 DATE（仅日期部分，时间默认为 00:00:00）；
- 输入 DATETIME 或带时间的字符串时，返回 DATETIME（包含日期和时间）。
- 输入带有 scale 的日期时间，返回值也会带有 scale
特殊情况：
- 任何参数为 NULL 时，返回 NULL；
- 无效日期、非法 `period`（非正整数）或 `type` 时，返回 NULL；
- 若取整结果早于日期类型支持的最小值（如 '0001-01-01' 之前），返回 NULL。
- 若输入参数无效（如格式错误的日期 ( 例如 2022-02-32 13:21:03, 具体 datetime 和 date 格式请查看 [datetime 的转换](https://doris.apache.org/zh-CN/docs/dev/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion/) 和 [date 的转换](https://doris.apache.org/zh-CN/docs/dev/sql-manual/basic-element/sql-data-types/conversion/date-conversion/))、非法的时间单位等），函数返回 NULL。

## 举例

```sql
-- 按 5 秒向下取整（周期起点为 00、05、10...秒）
mysql> select date_floor(cast("0001-01-01 00:00:18" as datetime), INTERVAL 5 SECOND);
+------------------------------------------------------------------------+
| date_floor(cast("0001-01-01 00:00:18" as datetime), INTERVAL 5 SECOND) |
+------------------------------------------------------------------------+
| 0001-01-01 00:00:15.000000                                             |
+------------------------------------------------------------------------+

---带有 scale 的日期时间，返回值也会带有 scale
mysql> select date_floor(cast("0001-01-01 00:00:18.123" as datetime), INTERVAL 5 SECOND);
+----------------------------------------------------------------------------+
| date_floor(cast("0001-01-01 00:00:18.123" as datetime), INTERVAL 5 SECOND) |
+----------------------------------------------------------------------------+
| 0001-01-01 00:00:15.000000                                                 |
+----------------------------------------------------------------------------+

-- 输入时间恰好是 5 天周期的起点
mysql> select date_floor("2023-07-10 00:00:00", INTERVAL 5 DAY);
+---------------------------------------------------+
| date_floor("2023-07-10 00:00:00", INTERVAL 5 DAY) |
+---------------------------------------------------+
| 2023-07-10 00:00:00                               |
+---------------------------------------------------+

--- date 类型的向下取整
mysql> select date_floor("2023-07-13", INTERVAL 5 YEAR);
+-------------------------------------------+
| date_floor("2023-07-13", INTERVAL 5 YEAR) |
+-------------------------------------------+
| 2021-01-01 00:00:00                       |
+-------------------------------------------+

---period 为负数，无效返回 NULL
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL -5 MINUTE);
+-------------------------------------------------------+
| date_floor("2023-07-13 22:28:18", INTERVAL -5 MINUTE) |
+-------------------------------------------------------+
| NULL                                                  |
+-------------------------------------------------------+

---datetime 无效，返回 NULL
mysql> select date_floor("2023-02-30 22:28:18", INTERVAL 5 DAY); 
+---------------------------------------------------+
| date_floor("2023-02-30 22:28:18", INTERVAL 5 DAY) |
+---------------------------------------------------+
| NULL                                              |
+---------------------------------------------------+

---不支持的 type 类型
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL 5 MILLISECOND);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'MILLISECOND' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 52)

---任一参数为 NULL
mysql> select date_floor(NULL, INTERVAL 5 HOUR);
+-----------------------------------+
| date_floor(NULL, INTERVAL 5 HOUR) |
+-----------------------------------+
| NULL                              |
+-----------------------------------+

--- 每五周向下取整
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL 5 WEEK);
+----------------------------------------------------+
| date_floor("2023-07-13 22:28:18", INTERVAL 5 WEEK) |
+----------------------------------------------------+
| 2023-07-10 00:00:00                                |
+----------------------------------------------------+

---超出最小日期范围，返回 NULL
mysql> select date_floor("0000-01-01", INTERVAL 5 WEEK);
+-------------------------------------------+
| date_floor("0000-01-01", INTERVAL 5 WEEK) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```