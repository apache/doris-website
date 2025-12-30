---
{
    "title": "MINUTE_CEIL",
    "language": "zh-CN",
    "description": "MINUTECEIL 函数用于将输入的日期时间值向上取整到最近的指定分钟周期。若指定起始时间（origin），则以该时间为基准划分周期并取整；若未指定，默认以 0001-01-01 00:00:00 为基准。该函数支持处理 DATETIME 类型"
}
---

## 描述

MINUTE_CEIL 函数用于将输入的日期时间值向上取整到最近的指定分钟周期。若指定起始时间（origin），则以该时间为基准划分周期并取整；若未指定，默认以 0001-01-01 00:00:00 为基准。该函数支持处理 DATETIME 类型

日期计算公式：
$$
\begin{aligned}
&\text{minute\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ 代表基准时间到达目标时间所需的周期数

## 语法

```sql
MINUTE_CEIL(`<date_or_time_expr>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<origin>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<period>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr>` | 需要向上取整的日期时间值，类型为 DATETIME，具体 datetime 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) |
| `<period>` | 分钟周期值，类型为 INT，表示每个周期包含的分钟数 |
| `<origin>` | 周期的起始时间点，类型为 DATETIME ，默认值为 0001-01-01 00:00:00 |

## 返回值

返回类型为 DATETIME，返回以输入日期时间为基准，向上取整到最近的指定分钟周期后的时间值。返回值的精度与输入参数 datetime 的精度相同。

- 若 `<period>` 为非正数（≤0），返回错误 。
- 若任一参数为 NULL，返回 NULL
- 不指定 period 时，默认以 1 分钟为周期
- `<origin>` 未指定，默认以 0001-01-01 00:00:00 为基准
- 若输入为 DATE 类型（仅包含年月日），默认其时间部分为 00:00:00。
- 计算结果大于最大日期时间 9999-12-31 23:59:59,返回错误
- 若 `<origin>` 日期时间在 `<period>` 之后，也会按照上述公式计算，不过周期 k 为负数。
- 若 `date_or_time_expr` 带有 scale,则返回结果也带有 scale 且小数部分为零 

## 举例

```sql
-- 以默认周期一分钟，默认起始时间 0001-01-01 00:00:00
SELECT MINUTE_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:29:00 |
+---------------------+

-- 带有小数，以默认的起始点的向上取整结果
SELECT MINUTE_CEIL('2023-07-13 22:28:18.123',5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000 |
+----------------------------+


-- 输入日期时间恰好为周期起点，则返回输入日期时间
SELECT MINUTE_CEIL('2023-07-13 22:30:00',5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00       |
+----------------------------+

-- 指定起始时间（origin）
SELECT MINUTE_CEIL('2023-07-13 22:28:18', 5, '2023-07-13 22:20:00') AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00       |
+----------------------------+

-- 只有起始日期和指定日
select minute_ceil("2023-07-13 22:28:18", "2023-07-01 12:21:23");
+-----------------------------------------------------------+
| minute_ceil("2023-07-13 22:28:18", "2023-07-01 12:21:23") |
+-----------------------------------------------------------+
| 2023-07-13 22:28:23                                       |
+-----------------------------------------------------------+

-- 带有 scale 的 datetime，会把小数位全部截断为 0
SELECT MINUTE_CEIL('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

--- 输入为 DATE 类型（默认时间 00:00:00）
SELECT MINUTE_CEIL('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

--- 若 <origin> 日期时间在 <period> 之后，也会按照上述公式计算，不过周期 k 为负数。
SELECT MINUTE_CEIL('0001-01-01 12:32:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 0001-01-01 12:35:00 |
+---------------------+

-- 计算结果大于最大日期时间 9999-12-31 23:59:59,返回错误
select minute_ceil("9999-12-31 23:59:18", 6);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_ceil of 9999-12-31 23:59:18, 6 out of range

-- 周期为非正数，返回错误
SELECT MINUTE_CEIL('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_ceil of 2023-07-13 22:28:18, -5 out of range

--- 任一参数为 NULL，返回 NULL
SELECT MINUTE_CEIL(NULL, 5), MINUTE_CEIL('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| minute_ceil(NULL, 5)  | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```
