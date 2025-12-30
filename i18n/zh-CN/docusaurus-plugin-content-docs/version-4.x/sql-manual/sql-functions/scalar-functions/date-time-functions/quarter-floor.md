---
{
    "title": "QUARTER_FLOOR",
    "language": "zh-CN",
    "description": "QUARTERFLOOR 函数用于将输入的日期时间值向下取整到最近的指定季度周期。若指定起始时间（origin），则以该时间为基准划分周期并取整；若未指定，默认以 0001-01-01 00:00:00 为基准。该函数支持处理 DATETIME 和 DATE 类型。"
}
---

## 描述

QUARTER_FLOOR 函数用于将输入的日期时间值向下取整到最近的指定季度周期。若指定起始时间（origin），则以该时间为基准划分周期并取整；若未指定，默认以 0001-01-01 00:00:00 为基准。该函数支持处理 DATETIME 和 DATE 类型。

日期时间的计算公式：

$$
\begin{aligned}
&\text{quarter\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ 代表的是基准时间到目标时间的周期数

## 语法

```sql
QUARTER_FLOOR(`<date_or_time_expr>`)
QUARTER_FLOOR(`<date_or_time_expr>`, `<origin>`)
QUARTER_FLOOR(`<date_or_time_expr>`, `<period>`)
QUARTER_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr>` | 需要向下取整的日期时间值，类型为 DATETIME 或 DATE ，具体 datetime/date 格式请查看 [datetime 的转换](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)|
| `<period>` | 季度周期值，类型为 INT，表示每个周期包含的季度数 |
| `<origin_datetime>` | 周期的起始时间点，类型为 DATETIME/DATE ，默认值为 0001-01-01 00:00:00 |

## 返回值

返回类型为 DATETIME，返回以输入日期时间为基准，向下取整到最近的指定季度周期后的时间值。返回值的精度与输入参数 datetime 的精度相同。

- 若 `<period>` 为非正（≤0），返回错误。
- 若任一参数为 NULL，返回 NULL。
- 不指定 period 时，默认以 1 个季度为周期。
- `<origin>` 未指定，默认以 0001-01-01 00:00:00 为基准。
- 若输入为 DATE 类型（仅包含年月日），默认其时间部分为 00:00:00。
- 若 `<origin>` 日期时间在 `<period>` 之后，也会按照上述公式计算，不过周期 k 为负数。
- 若 `date_or_time_expr` 带有 scale,则返回结果也带有 scale 且小数部分为零.

## 举例

```sql
-- 以默认周期1个季度，默认起始时间 0001-01-01 00:00:00
SELECT QUARTER_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- 以5个季度为一周期，以默认的起始点的向下取整结果
SELECT QUARTER_FLOOR('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- 输入日期时间恰好是周期起点，则返回输入日期时间
SELECT QUARTER_FLOOR('2023-07-01 00:00:00', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- 只有起始日期和指定日期
select QUARTER_FLOOR("2023-07-13 22:28:18", "2023-01-01 00:00:00");
+-------------------------------------------------------------+
| QUARTER_FLOOR("2023-07-13 22:28:18", "2023-01-01 00:00:00") |
+-------------------------------------------------------------+
| 2023-07-01 00:00:00                                         |
+-------------------------------------------------------------+

-- 指定起始时间（origin）
SELECT QUARTER_FLOOR('2023-07-13 22:28:18', 2, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

--- 带有 scale 的 datetime，会把小数位全部截断为 0
SELECT QUARTER_FLOOR('2023-07-13 22:28:18.456789', 1) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-01 00:00:00.000000 |
+----------------------------+

--- 若 <origin> 日期时间在 <period> 之后，也会按照上述公式计算，不过周期 k 为负数。
SELECT QUARTER_FLOOR('2022-09-13 22:28:18', 4, '2028-07-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2020-07-01 00:00:00 |
+---------------------+

--- 输入为 DATE 类型（默认时间 00:00:00）
SELECT QUARTER_FLOOR('2023-07-13', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

--- 周期为非正数，返回错误
SELECT QUARTER_FLOOR('2023-07-13 22:28:18', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarter_floor of 2023-07-13 22:28:18, -1 out of range

--- 任一参数为 NULL，返回 NULL
SELECT QUARTER_FLOOR(NULL, 1), QUARTER_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+------------------------+--------+
| quarter_floor(NULL, 1) | result |
+------------------------+--------+
| NULL                   | NULL   |
+------------------------+--------+
```

## 最佳实践

还可参阅 [date_floor](./date-floor)
