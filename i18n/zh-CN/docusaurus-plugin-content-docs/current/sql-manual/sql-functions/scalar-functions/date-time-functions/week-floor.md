---
{
    "title": "WEEK_FLOOR",
    "language": "zh-CN",
    "description": "WEEKFLOOR 函数用于将输入的日期时间值向下舍入到最接近的指定周间隔的起始时间，间隔单位为 WEEK。若指定了起始参考点（origin），则以该点为基准计算间隔；否则默认以 0000-01-01 00:00:00 为参考点。"
}
---

## 描述


WEEK_FLOOR 函数用于将输入的日期时间值向下舍入到最接近的指定周间隔的起始时间，间隔单位为 WEEK。若指定了起始参考点（origin），则以该点为基准计算间隔；否则默认以 0000-01-01 00:00:00 为参考点。

日期时间的计算公式：

$$
\begin{aligned}
&\text{week\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ 代表的是基准时间到目标时间的周期数

## 语法

```sql
WEEK_FLOOR(`<date_or_time_expr>`)
WEEK_FLOOR(`<date_or_time_expr>`, `<origin>`)
WEEK_FLOOR(`<date_or_time_expr>`, `<period>`)
WEEK_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr>` | 要向下舍入的日期时间值，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)|
| `<period>` | 周间隔值，类型为 INT，表示每个间隔的周数 |
| `<origin>` | 间隔的起始点，支持输入 date/datetime 类型；默认为 0000-01-01 00:00:00 |

## 返回值

返回类型为 DATETIME，表示向下舍入后的日期时间值。结果的时间部分将被设置为 00:00:00。

- 若 `<period>` 为非正数（≤0），函数返回错误；
- 若任一参数为 NULL，返回 NULL；
- 若 `<datetime>` 恰好是某间隔的起始点（基于 `<period>` 和 `<origin>`），则返回该起始点；
- 若输入为 date 类型，则返回 date 类型
- 若输入为  datetime 类型，则返回 datetime 类型，返回值的时间部分与起始时间一样。
- 对于 `<origin>` 日期时间超过 `<date_or_time_expr>`,也可以使用上述公式计算，不过 k 为负值。
- 若 `date_or_time_expr` 带有 scale,则返回结果也带有 scale 且小数部分为零

## 举例

```sql
-- 2023-07-13是周四，默认1周间隔（起始点为周一），向下舍入到最近的周一（2023-07-10）
SELECT WEEK_FLOOR(cast('2023-07-13 22:28:18' as datetime)) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- 指定2周为一间隔，向下舍入到最近的2周间隔起点
SELECT WEEK_FLOOR('2023-07-13 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- 输入日期时间恰好为周期起点，则返回输入日期时间
SELECT WEEK_FLOOR('2023-07-10 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- 带有小数部分
mysql> SELECT WEEK_FLOOR('2023-07-13 22:28:18.123', 2) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2023-07-10 00:00:00.000 |
+-------------------------+

-- 输入date类型，返回date类型
SELECT WEEK_FLOOR(cast('2023-07-13' as date)) AS result;
+------------+
| result     |
+------------+
| 2023-07-10 |
+------------+

-- 只有起始日期和指定日期
select week_floor("2023-07-13 22:28:18", "2021-05-01 12:00:00");
+----------------------------------------------------------+
| week_floor("2023-07-13 22:28:18", "2021-05-01 12:00:00") |
+----------------------------------------------------------+
| 2023-07-08 12:00:00                                      |
+----------------------------------------------------------+

-- 指定基准时间origin='2023-07-03'（周一），1周间隔
SELECT WEEK_FLOOR('2023-07-13', 1, '2023-07-03') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- datetime恰好是间隔起点（origin='2023-07-10'，period=1）
SELECT WEEK_FLOOR('2023-07-10', 1, '2023-07-10') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- 指定起始日期带有时间部分，则返回时间部分和起始时间一致
SELECT WEEK_FLOOR('2023-07-10', 1, '2023-07-10 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-03 12:00:00 |
+---------------------+

-- 无效period，返回错误
SELECT WEEK_FLOOR('2023-07-13', 0) AS result;
RROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation week_floor of 2023-07-13 00:00:00, 0 out of range

-- 参数为NULL
SELECT WEEK_FLOOR(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
