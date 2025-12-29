---
{
    "title": "WEEK_CEIL",
    "language": "zh-CN",
    "description": "WEEKCEIL 函数用于将输入的日期时间值向上舍入到最接近的指定周间隔的起始时间,间隔单位为 WEEK 。若指定了起始参考点（origin），则以该点为基准计算间隔；否则默认以 0000-01-01 00:00:00 为参考点。"
}
---

## 描述

WEEK_CEIL 函数用于将输入的日期时间值向上舍入到最接近的指定周间隔的起始时间,间隔单位为 WEEK 。若指定了起始参考点（origin），则以该点为基准计算间隔；否则默认以 0000-01-01 00:00:00 为参考点。

日期计算公式：
$$
\begin{aligned}
&\text{week\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ 代表基准时间到达目标时间所需的周期数

## 语法

```sql
WEEK_CEIL(`<date_or_time_expr>`)
WEEK_CEIL(`<date_or_time_expr>`, `<origin>`)
WEEK_CEIL(`<date_or_time_expr>`, `<period>`)
WEEK_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr>` | 要向上舍入的日期时间值，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | 周间隔值，类型为 INT，表示每个间隔的周数 |
| `<origin>` | 间隔的起始点，支持输入 date/datetime 类型；默认为 0000-01-01 00:00:00 |

## 返回值

返回类型为 DATETIME，表示向上舍入后的日期时间值。

- 若 `<period>` 为非正数（≤0），函数返回错误；
- 若任一参数为 NULL，返回 NULL；
- 若 `<date_or_time_expr>` 恰好是某间隔的起始点（基于 `<period>` 和 `<origin>`），则返回该起始点；
- 若输入为 date 类型，则返回 date 类型
- 若输入为  datetime 类型，则返回 datetime 类型，时间部分和起始时间一样。
- 计算结果超过最大日期时间 9999-12-31 23:59:59 ，则返回错误 。
- 对于 `<origin>` 日期时间超过 `<date_or_time_expr>`,也可以使用上述公式计算，不过 k 为负值。
- 若 `date_or_time_expr` 带有 scale,则返回结果也带有 scale 且小数部分为零

## 举例

```sql

-- 2023-07-13是周四，向上舍入到下一个间隔起点（1周间隔的起始点为周一，故舍入到2023-07-17（周一））
SELECT WEEK_CEIL(cast('2023-07-13 22:28:18' as datetime)) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-17 00:00:00 |
+---------------------+

-- 指定两周为一间隔
SELECT WEEK_CEIL('2023-07-13 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-24 00:00:00 |
+---------------------+

-- 带有小数部分
mysql> SELECT WEEK_CEIL('2023-07-13 22:28:18.123', 2) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2023-07-24 00:00:00.000 |
+-------------------------+

-- 输入日期时间恰好为周期起点，则返回输入日期时间
SELECT WEEK_CEIL('2023-07-24 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-08-07 00:00:00 |
+---------------------+

--输入 date 类型返回 date 类型， date 字符串返回 datetime
SELECT WEEK_CEIL(cast('2023-07-13' as date));
+---------------------------------------+
| WEEK_CEIL(cast('2023-07-13' as date)) |
+---------------------------------------+
| 2023-07-17                            |
+---------------------------------------+

-- 只有起始日期和指定日期
select week_ceil("2023-07-13 22:28:18", "2021-05-01 12:00:00");
+---------------------------------------------------------+
| week_ceil("2023-07-13 22:28:18", "2021-05-01 12:00:00") |
+---------------------------------------------------------+
| 2023-07-15 12:00:00                                     |
+---------------------------------------------------------+

---指定起始日期
SELECT WEEK_CEIL('2023-07-13', 1, '2023-07-03') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-17 00:00:00 |
+---------------------+

---指定时间为非 00:00:00 的 datetime ,返回时间部分也为起始时间部分
SELECT WEEK_CEIL('2023-07-10', 1, '2023-07-10 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 12:00:00 |
+---------------------+

---计算结果超过最大日期时间 9999-12-31 23:59:59 ，则返回错误 。
SELECT WEEK_CEIL('9999-12-31 22:28:18', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation week_ceil of 9999-12-31 22:28:18, 2 out of range

-- 无效period（非正整数）
SELECT WEEK_CEIL('2023-07-13', 0) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation week_ceil of 2023-07-13 00:00:00, 0 out of range


-- 参数为NULL
SELECT WEEK_CEIL(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
