---
{
    "title": "MONTHS_BETWEEN",
    "language": "cn"
}
---

## 描述

MONTHS_BETWEEN 函数用于计算两个日期时间值之间的月份差值，返回结果为浮点数。该函数支持处理 DATE、DATETIME 类型及符合格式的字符串，并可通过可选参数控制结果是否四舍五入。

:::tip
该函数自 3.0.6 版本开始支持.
:::

## 语法

```sql
MONTHS_BETWEEN(<enddate>, <startdate> [, <round_type>])
```

## 参数

| 参数         | 说明                                                |
|-------------------|------------------------------------------------------------|
| `<enddate>`   | 结束日期，支持输入 date/datetime 类型和符合日期时间格式的字符串,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)。     |
| `<startdate>` | 开始日期，支持输入 date/datetime 类型和符合日期时间格式的字符串. |
| `<round_type>` | 是否将结果四舍五入到第八位小数。支持 `true` 或 `false`。默认为 `true`。 |

## 返回值

返回 `<enddate>` 减去 `<startdate>` 得到的月份数（浮点数）

结果 = (`<enddate>.year` - `<startdate>.year`) * 12 + `<enddate>.month` - `<startdate>.month` + (`<enddate>.day` - `<startdate>.day`) / 31.0

- 当 `<enddate>` 或 `<startdate>` 为 NULL，或两者都为 NULL 时，返回 NULL
- 当 `<round_type>` 为 `true` 时，结果四舍五入到第八位小数,否则和 `DOUBLE` 精度一样，十五位小数。
- 若 `<enddate>` 早于 `<startdate>`，返回负值；
- 时间部分（时、分、秒）不影响计算，仅基于日期部分（年、月、日）计算差值。

当 `<enddate>` 和 `<startdate>` 满足以下条件时，函数会返回整数月份差值（忽略天数带来的分数部分）：

- 两个日期均为各自月份的最后一天（如 2024-01-31 与 2024-02-29）；
- 两个日期的「日部分」相同（如 2024-01-15 与 2024-03-15）。

## 示例

```sql
--- 两个日期的月份差值
SELECT MONTHS_BETWEEN('2020-12-26', '2020-10-25') AS result;
+------------+
| result     |
+------------+
| 2.03225806 |
+------------+

--- 包含时间部分（不影响结果）
SELECT MONTHS_BETWEEN('2020-12-26 15:30:00', '2020-10-25 08:15:00') AS result;
+------------+
| result     |
+------------+
| 2.03225806 |
+------------+

--- 关闭四舍五入（保留原始精度）
SELECT MONTHS_BETWEEN('2020-10-25', '2020-12-26', false) AS result;
+---------------------+
| result              |
+---------------------+
| -2.032258064516129  |
+---------------------+

--- 均为月末日期（触发特殊处理，返回整数）
SELECT MONTHS_BETWEEN('2024-02-29', '2024-01-31') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- 日部分相同（触发特殊处理，返回整数）
SELECT MONTHS_BETWEEN('2024-03-15', '2024-01-15') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

--- 日部分不同且非月末
SELECT MONTHS_BETWEEN('2024-02-29', '2024-01-30') AS result;
+------------+
| result     |
+------------+
| 0.96774194 |
+------------+

--- 输入为 NULL（返回 NULL）
SELECT MONTHS_BETWEEN(NULL, '2024-01-01') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

```
