---
{
    "title": "YEAR_FLOOR",
    "language": "zh-CN",
    "description": "YEARFLOOR 函数用于将输入的日期时间值向下舍入到最接近的指定年间隔的起始时间，间隔单位为年。若指定了起始参考点（origin），则以该点为基准计算间隔；否则默认以 0000-01-01 00:00:00 为参考点。"
}
---

## 描述
YEAR_FLOOR 函数用于将输入的日期时间值向下舍入到最接近的指定年间隔的起始时间，间隔单位为年。若指定了起始参考点（origin），则以该点为基准计算间隔；否则默认以 0000-01-01 00:00:00 为参考点。

计算日期时间公式：
$$
\begin{aligned}
&\text{year\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ 代表的是基准时间到目标时间的周期数

## 语法
```sql
YEAR_FLOOR(<date_or_time_expr>)
YEAR_FLOOR(<date_or_time_expr>, origin)
YEAR_FLOOR(<date_or_time_expr>, <period>)
YEAR_FLOOR(<date_or_time_expr>, <period>, <origin>)
```

## 参数
| 参数                  | 说明                                                       |
|---------------------|----------------------------------------------------------|
| `<date_or_time_expr>`       | 要向下舍入的日期时间值，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)                              |
| `<period>`          | 可选，表示每个周期由多少秒组成，支持正整数类型（INT）。默认为 1 秒。                    |
| `<origin_datetime>` | 间隔的起始点，支持输入 date/datetime 类型；默认为 0000-01-01 00:00:00。 |


## 返回值
返回与输入类型一致的结果（DATETIME 或 DATE），表示向下舍入后的年间隔起始时间：

- 若输入为 DATE 类型，返回 DATE 类型（仅包含日期部分）；若输入为 DATETIME 或符合格式的字符串，返回 DATETIME 类型（时间部分与 origin 一致，无 origin 时默认为 00:00:00）。
- 若 `<period>` 为非正数（≤0），函数返回错误。
- 若任一参数为 NULL，返回 NULL。
- 若 `<date_or_time_expr>` 恰好是某间隔的起始点（基于 `<period>` 和 `<origin>`），则返回该起始点。
- 若计算结果超过最大日期时间 9999-12-31 23:59:59，返回错误。
- 若 `<origin>` 日期时间在 `<period>` 之后，也会按照上述公式计算，不过周期 k 为负数。
- 若 `date_or_time_expr` 带有 scale,则返回结果也带有 scale 且小数部分为零

## 举例
```sql
-- 默认1年间隔（起始点为每年1月1日），2023-07-13向下舍入到2023-01-01
SELECT YEAR_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- 指定5年间隔，2023-07-13向下舍入到最近的5年间隔起点（以默认origin计算）
SELECT YEAR_FLOOR('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-01-01 00:00:00 |  
+---------------------+

-- 带有 scale 的情况
mysql> SELECT YEAR_FLOOR('2023-07-13 22:28:18.123', 5) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2021-01-01 00:00:00.000 |
+-------------------------+

-- 只有起始日期和指定日期
select year_floor("2023-07-13 22:28:18", "2021-03-13 22:13:00");
+----------------------------------------------------------+
| year_floor("2023-07-13 22:28:18", "2021-03-13 22:13:00") |
+----------------------------------------------------------+
| 2023-03-13 22:13:00                                      |
+----------------------------------------------------------+

-- 输入为DATE类型，返回DATE类型的间隔起点
SELECT YEAR_FLOOR(cast('2023-07-13' as date)) AS result;
+------------+
| result     |
+------------+
| 2023-01-01 |
+------------+

-- 指定起始基准点origin='2020-01-01'，1年间隔，2023-07-13舍入到2023-01-01
SELECT YEAR_FLOOR('2023-07-13', 1, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- 指定origin包含时间部分，返回结果的时间部分与origin一致
SELECT YEAR_FLOOR('2023-07-13', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 08:30:00 |
+---------------------+

--- 若 <origin> 日期时间在 <period> 之后，也会按照上述公式计算，不过周期 k 为负数。
SELECT YEAR_FLOOR('2023-07-13 22:22:56', 1, '2028-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 08:30:00 |
+---------------------+

-- 输入恰好是间隔起点（origin='2023-01-01'，period=1），返回自身
SELECT YEAR_FLOOR('2023-01-01', 1, '2023-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- 输入时间早于origin起始时间，向下舍入到更早的间隔点
SELECT YEAR_FLOOR('2019-07-13', 1, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2019-01-01 00:00:00 |
+---------------------+

-- 跨多个周期的向下舍入，period=3，origin='2020-01-01'
SELECT YEAR_FLOOR('2025-07-13', 3, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- 输入时间部分早于origin时间部分，同年内向下舍入
SELECT YEAR_FLOOR('2023-07-13 06:00:00', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2022-01-01 08:30:00 |
+---------------------+

-- 输入时间部分晚于origin时间部分，正常向下舍入
SELECT YEAR_FLOOR('2023-07-13 10:00:00', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 08:30:00 |
+---------------------+

-- 无效period（非正数）
SELECT YEAR_FLOOR('2023-07-13', 0) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_floor of 2023-07-13 00:00:00, 0 out of range

-- 任一参数为NULL，返回NULL
SELECT YEAR_FLOOR(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

```