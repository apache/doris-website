---
{
    "title": "SECOND_FLOOR",
    "language": "zh-CN",
    "description": "SECONDFLOOR 函数用于将输入的日期时间值向下取整到最近的指定秒周期。若指定起始时间（origin），则以该时间为基准划分周期并取整；若未指定，默认以 0001-01-01 00:00:00 为基准。该函数支持处理 DATETIME 类型。"
}
---

## 描述

SECOND_FLOOR 函数用于将输入的日期时间值向下取整到最近的指定秒周期。若指定起始时间（origin），则以该时间为基准划分周期并取整；若未指定，默认以 0001-01-01 00:00:00 为基准。该函数支持处理 DATETIME 类型。

日期时间的计算公式：
$$
\begin{aligned}
&\text{second\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ 代表的是基准时间到目标时间的周期数

## 语法

```sql
SECOND_FLOOR(<datetime>[, <period>][, <origin_datetime>])
```

## 参数

| 参数                  | 说明                                                       |
|---------------------|----------------------------------------------------------|
| `<datetime>`        | 必填，输入的日期时间值，支持输入 datetime 类型,具体 datetime 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)                            |
| `<period>`          | 可选，表示每个周期由多少秒组成，支持正整数类型（INT）。默认为 1 秒。                    |
| `<origin_datetime>` | 可选，对齐的时间起点，支持输入 datetime 类型。如果未指定，默认为 0001-01-01T00:00:00。 |

## 返回值
返回类型为 DATETIME，返回以输入日期时间为基准，向下取整到最近的指定秒周期后的时间值。返回值的精度与输入参数 datetime 的精度相同。

- 若 `<period>` 为非正数（≤0），返回错误。
- 若任一参数为 NULL，返回 NULL。
- 不指定 period 时，默认以 1 秒为周期。
- `<origin_datetime>` 未指定时，默认以 0001-01-01 00:00:00 为基准。
- 若输入为 DATE 类型（仅包含年月日），默认其时间部分为 00:00:00。
- 带有 scale 的日期时间，返回也带有 scale, 小数位全部截断为 0.
- 若 `<origin>` 日期在 `<period>` 之后，也按照上述公式计算，不过 k 代入负数

## 举例

```sql
--- 以默认周期 1 秒，默认起始时间 0001-01-01 00:00:00
SELECT SECOND_FLOOR('2025-01-23 12:34:56') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- 以 5 秒为一周期，默认起始点的向下取整结果
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:55 |
+---------------------+

-- 只有起始日期和指定日期
select second_floor("2023-07-13 22:28:18", "2023-07-13 22:13:12.123");
+----------------------------------------------------------------+
| second_floor("2023-07-13 22:28:18", "2023-07-13 22:13:12.123") |
+----------------------------------------------------------------+
| 2023-07-13 22:28:17.123                                        |
+----------------------------------------------------------------+

-- 指定起始时间（origin）
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 10, '2025-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:50 |
+---------------------+

-- 若 `<origin>` 日期在 `<period>` 之后，也按照上述公式计算，不过 k 代入负数
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 10, '2029-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:50 |
+---------------------+

--- 带有微秒的 datetime，取整后小数位截断为 0
SELECT SECOND_FLOOR('2025-01-23 12:34:56.789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2025-01-23 12:34:55.000    |
+----------------------------+

--- 输入为 DATE 类型（默认时间 00:00:00）
SELECT SECOND_FLOOR('2025-01-23', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 00:00:00 |
+---------------------+

--- 周期为非正数，返回错误
SELECT SECOND_FLOOR('2025-01-23 12:34:56', -3) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_floor of 2025-01-23 12:34:56, -3 out of range

--- 任一参数为 NULL，返回 NULL
SELECT SECOND_FLOOR(NULL, 5), SECOND_FLOOR('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| second_floor(NULL, 5)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+
```