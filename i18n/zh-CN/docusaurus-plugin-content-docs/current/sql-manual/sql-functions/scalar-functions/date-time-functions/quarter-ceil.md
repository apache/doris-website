---
{
    "title": "QUARTER_CEIL",
    "language": "zh-CN",
    "description": "QUARTERCEIL 函数用于将输入的日期时间值向上取整到最近的指定季度周期。若指定起始时间（origin），则以该时间为基准划分周期并取整；若未指定，默认以 0001-01-01 00:00:00 为基准。该函数支持处理 DATETIME、DATE 类型。"
}
---

## 描述

QUARTER_CEIL 函数用于将输入的日期时间值向上取整到最近的指定季度周期。若指定起始时间（origin），则以该时间为基准划分周期并取整；若未指定，默认以 0001-01-01 00:00:00 为基准。该函数支持处理 DATETIME、DATE 类型。

日期计算公式：
$$
\begin{aligned}
&\text{quarter\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ 代表基准时间到达目标时间所需的周期数

## 语法

```sql
QUARTER_CEIL(`<date_or_time_expr>`)
QUARTER_CEIL(`<date_or_time_expr>`, `<origin>`)
QUARTER_CEIL(`<date_or_time_expr>`, `<period>`)
QUARTER_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr>` | 需要向上取整的日期时间值，参数是合法的日期表达式，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | 季度周期值，类型为 INT，表示每个周期包含的季度数 |
| `<origin>` | 周期的起始时间点，支持输入 date/datetime 类型，默认值为 0001-01-01 00:00:00 |

## 返回值

返回类型为 DATETIME，返回以输入日期时间为基准，向上取整到最近的指定季度周期后的时间值。返回值的精度与输入参数 datetime 的精度相同。

- 若 `<period>` 为非正，返回错误。
- 若任一参数为 NULL，返回 NULL。
- 不指定 period 时，默认以 1 个季度为周期。
- `<origin>` 未指定，默认以 0001-01-01 00:00:00 为基准。
- 输入为 DATE 类型（默认时间设置为 00:00:00）。
- 计算结果超过日期最大范围 9999-12-31 23:59:59，结果返回错误
- 若 `<origin>` 日期时间在 `<period>` 之后，也会按照上述公式计算，不过周期 k 为负数。
- 若 `date_or_time_expr` 带有 scale,则返回结果也带有 scale 且小数部分为零.

## 举例

```sql
-- 以默认周期1个季度，默认起始时间 0001-01-01 00:00:00
SELECT QUARTER_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-10-01 00:00:00 |
+---------------------+

-- 以5个季度为一周期，以默认起始点的向上取整结果
SELECT QUARTER_CEIL('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2024-10-01 00:00:00 |
+---------------------+

-- 只有起始日期和指定日期
select QUARTER_CEIL("2023-07-13 22:28:18", "2022-07-01 00:00:00");
+-------------------------------------------------------------+
| QUARTER_CEIL("2023-07-13 22:28:18", "2022-07-01 00:00:00") |
+-------------------------------------------------------------+
| 2023-10-01 00:00:00                                         |
+-------------------------------------------------------------+

-- 输入日期时间恰好在周期起点，则返回输入日期时间
SELECT QUARTER_CEIL('2023-10-01 00:00:00', 1) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-10-01 00:00:00        |
+----------------------------+

-- 指定起始时间（origin）
SELECT QUARTER_CEIL('2023-07-13 22:28:18', 2, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 00:00:00 |
+---------------------+

--- 带有 scale 的 datetime，时间部分及小数位均截断为 0
SELECT QUARTER_CEIL('2023-07-13 22:28:18.456789', 1) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-10-01 00:00:00.000000 |
+----------------------------+

--- 若 <origin> 日期时间在 <period> 之后，也会按照上述公式计算，不过周期 k 为负数。
SELECT QUARTER_CEIL('2022-09-13 22:28:18', 4, '2028-07-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-07-01 00:00:00 |
+---------------------+

--- 输入为 DATE 类型（默认时间 00:00:00）
SELECT QUARTER_CEIL('2023-07-13', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-10-01 00:00:00 |
+---------------------+

-- 计算结果超过日期最大范围 9999-12-31，结果返回错误
SELECT QUARTER_CEIL('9999-10-13 22:28:18', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarter_ceil of 9999-10-13 22:28:18, 2 out of range

--- 周期为非正数，返回错误
SELECT QUARTER_CEIL('2023-07-13 22:28:18', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarter_ceil of 2023-07-13 22:28:18, -1 out of range

--- 任一参数为 NULL，返回 NULL
SELECT QUARTER_CEIL(NULL, 1), QUARTER_CEIL('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| quarter_ceil(NULL, 1) | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```

## 最佳实践

还可参阅 [date_ceil](./date-ceil)
