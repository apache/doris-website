---
{
    "title": "PREVIOUS_DAY",
    "language": "cn",
    "description": "PREVIOUS_DAY 函数用于返回指定日期之前第一个匹配目标星期几的日期，例如 PREVIOUS_DAY('2020-01-31', 'MONDAY') 表示 2020-01-31 前的第一个周一。该函数支持处理 DATE、DATETIME 类型，忽略输入中的时间部分（仅基于日期部分计算）。"
}
---

## 描述

PREVIOUS_DAY 函数用于返回指定日期之前第一个匹配目标星期几的日期，例如 PREVIOUS_DAY('2020-01-31', 'MONDAY') 表示 2020-01-31 前的第一个周一。该函数支持处理 DATE、DATETIME、TIMESTAMPTZ 类型，忽略输入中的时间部分（仅基于日期部分计算）。

:::note
该函数从4.0.4起开始支持
:::

## 语法

```sql
PREVIOUS_DAY(`<date_or_time_expr>`, `<day_of_week>`)
```

## 参数

| 参数                  | 描述                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<date_or_time_expr>` | 支持输入 date/datetime 类型,具体格式请查看 [timestamptz的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)，[datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)。 |
| `<day_of_week>`       | 用于标识星期几的字符串表达式，为字符串类型。                                                                                                                                                                                                                                                                                                                                          |

`<day_of_week>` 必须是以下值之一（不区分大小写）：
- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## 返回值

返回类型为 DATE，表示基准日期之前第一个匹配 `<day_of_week>` 的日期。

特殊情况：
- 若基准日期本身就是目标星期几，返回前目标星期几（而非当前日期）；
- 若 `<date_or_time_expr>` 为 NULL，返回 NULL；
- 若 `<day_of_week>` 为无效值（如 'ABC'），抛出异常；
- 若输入为 0000-01-01（无论是否包含时间），返回自身（因该日期是最小有效日期，不存在前置日期）；

## 示例

``` sql
--- 基准日期前第一个星期一
SELECT PREVIOUS_DAY('2020-01-31', 'MONDAY') AS result;
+------------+
| result     |
+------------+
| 2020-01-27 |
+------------+

--- 包含时间部分（忽略时间，仅用日期计算）
SELECT PREVIOUS_DAY('2020-01-31 02:02:02', 'MON') AS result;
+------------+
| result     |
+------------+
| 2020-01-27 |
+------------+

--- 基准日期本身是目标星期几（返回前一个）
SELECT PREVIOUS_DAY('2023-07-17', 'MON') AS result;  -- 2023-07-17 是星期一
+------------+
| result     |
+------------+
| 2023-07-10 |
+------------+

--- 目标星期几为简称（不区分大小写）
SELECT PREVIOUS_DAY('2023-07-13', 'WE') AS result;  -- 2023-07-13 是星期四
+------------+
| result     |
+------------+
| 2023-07-12 |
+------------+

--- 输入为 NULL（返回 NULL）
SELECT PREVIOUS_DAY(NULL, 'SUN') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- 无效的星期标识（抛出异常）
mysql> SELECT PREVIOUS_DAY('2023-07-13', 'ABC') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Function previous_day failed to parse weekday: ABC

--- 最大日期（返回自身）
SELECT PREVIOUS_DAY('0000-01-01 12:00:00', 'SUNDAY') AS result;
+------------+
| result     |
+------------+
| 0000-01-01 |
+------------+
```
