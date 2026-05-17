---
{
    "title": "TIMESTAMPADD",
    "language": "zh-CN",
    "description": "与 dateadd 函数 作用一致 TIMESTAMPADD 函数用于向指定的日期时间值添加（或减去）指定单位的时间间隔，并返回计算后的日期时间值。该函数支持多种时间单位（如秒、分、时、日、周、月、年等），可灵活处理日期时间的偏移计算，负数间隔表示减去对应时间。"
}
---

## 描述

与 [date_add 函数](./date-add) 作用一致
TIMESTAMPADD 函数用于向指定的日期时间值添加（或减去）指定单位的时间间隔，并返回计算后的日期时间值。该函数支持多种时间单位（如秒、分、时、日、周、月、年等），可灵活处理日期时间的偏移计算，负数间隔表示减去对应时间。

该函数与 mysql 中的 [timestampadd 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestampadd) 行为一致

## 语法

```sql
TIMESTAMPADD(<unit>, <interval>, <date_or_time_expr>)
```

## 参数

| 参数 | 说明                                                                |
| -- |-------------------------------------------------------------------|
| `<unit>` | 时间单位，指定要添加的时间单位，常见的值有 SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, QUARTER, YEAR |
|`<interval>`| 要添加的时间间隔，通常是一个整数，可以是正数或负数，表示添加或减去的时间长度                            |
| `<date_or_time_expr>` | 合法的目标日期，支持输入 date/datetime 类型具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)                                            |

## 返回值

返回值表示基础日期时间添加指定间隔后的结果。

- 若输入为 date 类型，并且时间单位为 YEAR/MONTH/WEEK/DAY ,返回 date 类型，否则返回 datetime 类型。
- 若输入为 datetime 类型，返回也是 datetime 类型。
- 若计算结果超出 DATETIME 类型的有效范围（0000-01-01 00:00:00 至 9999-12-31 23:59:59.999999），抛出异常。
- 若 <datetime_expr> 为无效日期（如 0000-00-00、2023-13-01）或 <unit> 为不支持的单位，抛出异常。
- 若任一参数为 NULL，返回 NULL。
- 处理月份 / 年份时，会自动适配月末日期（如 2023-01-31 加 1 个月为 2023-02-28 或 2023-02-29，取决于是否闰年）。

## 举例

```sql
-- 添加1分钟
SELECT TIMESTAMPADD(MINUTE, 1, '2019-01-02') AS result;
+---------------------+
| result              |
+---------------------+
| 2019-01-02 00:01:00 |
+---------------------+

-- 添加1周（7天）
SELECT TIMESTAMPADD(WEEK, 1, '2019-01-02') AS result;
+------------+
| result     |
+------------+
| 2019-01-09 |
+------------+

-- 减去3小时
SELECT TIMESTAMPADD(HOUR, -3, '2023-07-13 10:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 07:30:00 |
+---------------------+

-- 月末加1个月（自动适配2月天数）
SELECT TIMESTAMPADD(MONTH, 1, '2023-01-31') AS result;
+------------+
| result     |
+------------+
| 2023-02-28 |
+------------+

-- 跨年加1年
SELECT TIMESTAMPADD(YEAR, 1, '2023-12-31 23:59:59') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-12-31 23:59:59 |
+---------------------+

-- 无效单位
SELECT TIMESTAMPADD(MIN, 5, '2023-01-01') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported time stamp diff time unit: MIN, supported time unit: YEAR/MONTH/WEEK/DAY/HOUR/MINUTE/SECOND

---任意参数为 NULL
SELECT TIMESTAMPADD(YEAR,NULL, '2023-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

---单位不支持，无效
SELECT TIMESTAMPADD(YEAR,10000, '2023-12-31 23:59:59') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_add of 2023-12-31 23:59:59, 10000 out of range

```
