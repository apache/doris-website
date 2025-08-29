---
{
    "title": "SECOND_CEIL",
    "language": "zh-CN"
}
---

## 描述
SECOND_CEIL 函数用于将输入的日期时间值向上取整到最近的指定秒周期。若指定起始时间（origin），则以该时间为基准划分周期并取整；若未指定，默认以 0001-01-01 00:00:00 为基准。该函数支持处理 DATETIME 类型。

日期计算公式
SECOND_CEIL(<date_or_time_expr>, <period>, <origin>) = min{<origin> + k × <period> × second | k ∈ ℤ ∧ <origin> + k × <period> × second ≥ <date_or_time_expr>}
K 代表基准时间到达目标时间所需的周期数

## 语法

```sql
SECOND_CEIL(<datetime>[, <period>][, <origin_datetime>])
```

## 参数

| 参数                  | 说明                                                       |
|---------------------|----------------------------------------------------------|
| `<datetime>`        | 必填，输入的日期时间值，支持输入 datetime 类型,具体 datetime 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)                            |
| `<period>`          | 可选，表示每个周期由多少秒组成，支持正整数类型（INT）。默认为 1 秒。                   |
| `<origin_datetime>` | 可选，对齐的时间起点，支持输入 datetime 类型和符合日期时间格式的字符串。如果未指定，默认为 0001-01-01T00:00:00。 |

## 返回值

返回类型为 DATETIME，返回以输入日期时间为基准，向上取整到最近的指定秒周期后的时间值。返回值的精度与输入参数 datetime 的精度相同。

- 若 <period> 为非正整数（≤0），返回错误。
- 若任一参数为 NULL，返回 NULL。
- 不指定 period 时，默认以 1 秒为周期。
- <origin> 未指定时，默认以 0001-01-01 00:00:00 为基准。
- 若输入为 DATE 类型（仅包含年月日），默认其时间部分为 00:00:00。
- 若计算结果超出 DATETIME 类型的有效范围（0000-01-01 00:00:00 至 9999-12-31 23:59:59.999999），返回错误。
- 带有 scale 的日期时间，小数位全部截断为 0.

## 举例

```sql
--- 以默认周期 1 秒，默认起始时间 0001-01-01 00:00:00
SELECT SECOND_CEIL('2025-01-23 12:34:56') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

--- 以 5 秒为一周期，默认起始点的向上取整结果
SELECT SECOND_CEIL('2025-01-23 12:34:56', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

--- 指定起始时间（origin）
SELECT SECOND_CEIL('2025-01-23 12:34:56', 10, '2025-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

--- 带有微秒的 datetime，取整后小数位截断为 0
SELECT SECOND_CEIL('2025-01-23 12:34:56.789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2025-01-23 12:35:00.000000 |
+----------------------------+

--- 输入为 DATE 类型（默认时间 00:00:00）
SELECT SECOND_CEIL('2025-01-23', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 00:00:00 |
+---------------------+

--- 计算结果超出最大日期时间范围，返回错误
SELECT SECOND_CEIL('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_ceil of 9999-12-31 23:59:59, 2 out of range

--- 周期为非正数，返回错误
SELECT SECOND_CEIL('2025-01-23 12:34:56', -3) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation second_ceil of 2025-01-23 12:34:56, -3 input wrong parameters, period can not be negative or zero

--- 任一参数为 NULL，返回 NULL
SELECT SECOND_CEIL(NULL, 5), SECOND_CEIL('2025-01-23 12:34:56', NULL) AS result;
+------------------------+--------+
| second_ceil(NULL, 5)   | result |
+------------------------+--------+
| NULL                   | NULL   |
+------------------------+--------+
```
