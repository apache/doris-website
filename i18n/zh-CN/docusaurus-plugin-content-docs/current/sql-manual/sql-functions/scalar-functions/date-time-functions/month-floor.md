---
{
    "title": "MONTH_FLOOR",
    "language": "zh-CN",
    "description": "MONTH_FLOOR 函数用于将输入的日期时间值向下取整到最近的指定月份周期。若指定起始时间（origin），则以该时间为基准划分周期并取整；若未指定，默认以 0001-01-01 00:00:00 为基准。"
}
---

## 描述

MONTH_FLOOR 函数用于将输入的日期时间值向下取整到最近的指定月份周期。若指定起始时间（origin），则以该时间为基准划分周期并取整；若未指定，默认以 0001-01-01 00:00:00 为基准。

日期时间的计算公式：

$$
\begin{aligned}
&\text{month\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ 代表的是基准时间到目标时间的周期数

## 语法

```sql
MINUTE_FLOOR(`<date_or_time_expr>`)
MINUTE_FLOOR(`<date_or_time_expr>`, `<origin>`)
MINUTE_FLOOR(`<date_or_time_expr>`, `<period>`)
MINUTE_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr>` | 需要向下取整的日期时间值，类型为 DATETIME 或 DATE ，具体格式请查看 [timestamptz的转换](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)|
| `<period>` | 月份周期值，类型为 INT，表示每个周期包含的月数 |
| `<origin>` | 周期的起始时间点，类型为 DATETIME/DATE ，默认值为 0001-01-01 00:00:00 |

## 返回值

返回类型为 TIMESTAMPTZ, DATETIME 或 DATE，返回以输入日期时间为基准，向下取整到最近的指定月份周期后的时间值。返回值的精度与输入参数 datetime 的精度相同。

- 若输入为 TIMESTAMPTZ 类型，则会先将其转换为 local_time(如：`2025-12-31 23:59:59+05:00` 在会话变量为`+08:00`的情况下代表的local_time为`2026-01-01 02:59:59`),再进行 FLOOR 计算操作。
- 若输入的时间值(`<date_or_time_expr>` 和`<period>`)同时包含 TIMESTAMPTZ 和 DATETIME 类型，则输出 DATETIME 类型。
- 若 `<period>` 为非正（≤0），返回错误。
- 若任一参数为 NULL，返回 NULL。
- 不指定 period 时，默认以 1 分钟为周期。
- `<origin>` 未指定，默认以 0001-01-01 00:00:00 为基准。
- 若输入为 DATE 类型（仅包含年月日），默认其时间部分为 00:00:00。
- 若 `<origin>` 日期时间在 `<period>` 之后，也会按照上述公式计算，不过周期 k 为负数。
- 若 `date_or_time_expr` 带有 scale,则返回结果也带有 scale 且小数部分为零.

## 举例

```sql
-- 以默认周期1个月，默认起始时间 0001-01-01 00:00:00
SELECT MONTH_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- 以5个月为一周期，以默认的起始点的向下取整结果
SELECT MONTH_FLOOR('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- 输入日期时间恰好是周期起点，则返回输入日期时间
SELECT MONTH_FLOOR('2023-06-01 00:00:00', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- 只有起始日期和指定日期
 select month_floor("2023-07-13 22:28:18", "2023-01-04 00:00:00");
+-----------------------------------------------------------+
| month_floor("2023-07-13 22:28:18", "2023-01-04 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-04 00:00:00                                       |
+-----------------------------------------------------------+

-- 指定起始时间（origin）
SELECT MONTH_FLOOR('2023-07-13 22:28:18', 5, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:25:00 |
+---------------------+

--- 带有 scale 的 datetime，会把小数位全部截断为 0
SELECT MINUTE_FLOOR('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:25:00.000000 |
+----------------------------+

--- 若 <origin> 日期时间在 <period> 之后，也会按照上述公式计算，不过周期 k 为负数。
SELECT MONTH_FLOOR('2022-09-13 22:28:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2022-09-03 22:20:00 |
+---------------------+

--- 输入为 DATE 类型（默认时间 00:00:00）
SELECT MINUTE_FLOOR('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

-- TimeStampTz类型样例, SET time_zone = '+08:00'
-- 将变量值转换为 local_time(2026-01-01 02:59:59)后再做 FLOOR 操作
SELECT MONTH_FLOOR('2025-12-31 23:59:59+05:00');
+------------------------------------------+
| MONTH_FLOOR('2025-12-31 23:59:59+05:00') |
+------------------------------------------+
| 2026-01-01 00:00:00+08:00                |
+------------------------------------------+

-- 若参数同时包含 TimeStampTz 和 Datetime 类型，则输出 DateTime 类型
SELECT MONTH_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+---------------------------------------------------------------------+
| MONTH_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+---------------------------------------------------------------------+
| 2025-12-15 00:00:00.123                                             |
+---------------------------------------------------------------------+

--- 周期为非正数，返回错误
SELECT MONTH_FLOOR('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_floor of 2023-07-13 22:28:18, -5 out of range

--- 任一参数为 NULL，返回 NULL
SELECT MONTH_FLOOR(NULL, 5), MONTH_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| month_floor(NULL, 5)  | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```
