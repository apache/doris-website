---
{
    "title": "MONTHS_DIFF",
    "language": "zh-CN"
}
---

## 描述
MONTHS_DIFF 函数用于计算两个日期时间值之间的整数月份差值，返回结果为 `<enddate>` 减去 `<startdate>` 后的月份数。该函数支持处理 DATE、DATETIME 类型及符合格式的字符串，仅基于日期部分（年、月、日）计算，忽略时间部分（时、分、秒）。

## 语法

```sql
MONTHS_DIFF(<enddate>, <startdate>)
```

## 参数

| 参数            | 说明                                                      |
|---------------|---------------------------------------------------------|
| `<enddate>`   | 结束日期，支持输入 date/datetime 类型和符合日期时间格式的字符串,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)。 |
| `<startdate>` | 开始日期，支持输入 date/datetime 类型和符合日期时间格式的字符串 |

## 返回值

返回 `<enddate>` 减去 `<startdate>` 所得月份数.

基础差值 =（结束年份 - 开始年份）× 12 +（结束月份 - 开始月份）；
若结束日期的「日部分」< 开始日期的「日部分」，则最终结果 = 基础差值 - 1；
其他情况，最终结果 = 基础差值。

- 若 `<enddate>` 早于 `<startdate>`，返回负值（计算逻辑同上，仅符号相反）；
- 若任一参数为 NULL，返回 NULL；


## 举例

```sql
--- 年月差为1，且结束日 < 开始日（结果减1）
SELECT MONTHS_DIFF('2020-03-28', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- 年月差为1，且结束日 = 开始日
SELECT MONTHS_DIFF('2020-03-29', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- 年月差为1，且结束日 > 开始日
SELECT MONTHS_DIFF('2020-03-30', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- 结束日期早于开始日期（负值逻辑同理）
SELECT MONTHS_DIFF('2020-02-29', '2020-03-28') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

SELECT MONTHS_DIFF('2020-02-29', '2020-03-29') AS result;
+--------+
| result |
+--------+
|     -1 |
+--------+

--- 同一月份（结果为0）
SELECT MONTHS_DIFF('2023-07-15', '2023-07-30') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- 输入为NULL（返回NULL）
SELECT MONTHS_DIFF(NULL, '2023-01-01') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```