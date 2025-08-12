---
{
  "title": "MONTH_CEIL",
  "language": "zh-CN"
}
---

## 描述

MONTH_CEIL 函数用于将输入的日期时间值向上取整到最近的指定月份周期。若指定起始时间（origin），则以该时间为基准划分周期并取整；若未指定，默认以 0001-01-01 00:00:00 为基准。该函数支持处理 DATETIME、DATE 类型及符合格式的字符串。

## 语法

```sql
MONTH_CEIL(<datetime>)
MONTH_CEIL(<datetime>, <origin>)
MONTH_CEIL(<datetime>, <period>)
MONTH_CEIL(<datetime>, <period>, <origin>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<datetime>` | 需要向上取整的日期时间值，参数是合法的日期表达式，支持输入 date/datetime 类型和符合日期时间格式的字符串,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)|
| `<period>` | 月份周期值，类型为 INT，表示每个周期包含的月数 |
| `<origin>` | 周期的起始时间点，支持输入 date/datetime 类型和符合日期时间格式的字符串，默认值为 0001-01-01 00:00:00 |

## 返回值

返回类型为 DATETIME，返回以输入日期时间为基准，向上取整到最近的指定月份周期后的时间值。结果的时间部分将被设置为 00:00:00,日部分会截断为 01。

- 若 <period> 为非正整数（≤0），返回 NULL。
- 若任一参数为 NULL，返回 NULL。
- 不指定 period 时，默认以 1 个月为周期。
- <origin> 未指定，默认以 0001-01-01 00:00:00 为基准。
- 输入为 DATE 类型（默认时间 00:00:00）。
- 计算结果超过日期最大范围 9999-12-31，结果返回 NULL

## 举例

```sql
--- 以默认周期1个月，默认起始时间 0001-01-01 00:00:00
SELECT MONTH_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-08-01 00:00:00 |
+---------------------+

--- 以5个月为一周期，以默认起始点的向上取整结果
SELECT MONTH_CEIL('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-12-01 00:00:00 |
+---------------------+

--- 指定起始时间（origin）
SELECT MONTH_CEIL('2023-07-13 22:28:18', 5, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-11-01 00:00:00 |
+---------------------+

--- 带有 scale 的 datetime，时间部分及小数位均截断为 0
SELECT MONTH_CEIL('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-12-01 00:00:00.000000 |
+----------------------------+

--- 输入为 DATE 类型（默认时间 00:00:00）
SELECT MONTH_CEIL('2023-07-13', 3) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-10-01 00:00:00 |
+---------------------+

-- 计算结果超过日期最大范围 9999-12-31，结果返回 NULL
SELECT MONTH_CEIL('9999-12-13 22:28:18',5) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- 周期为非正数，返回 NULL
SELECT MONTH_CEIL('2023-07-13 22:28:18', -5) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- 任一参数为 NULL，返回 NULL
SELECT MONTH_CEIL(NULL, 5), MONTH_CEIL('2023-07-13 22:28:18', NULL) AS result;
+----------------------+--------+
| month_ceil(NULL, 5)  | result |
+----------------------+--------+
| NULL                 | NULL   |
+----------------------+--------+
```

## 最佳实践

还可参阅 [date_ceil](./date-ceil)
