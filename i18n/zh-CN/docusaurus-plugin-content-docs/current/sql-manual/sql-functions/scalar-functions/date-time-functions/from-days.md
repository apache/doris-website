---
{
    "title": "FROM_DAYS",
    "language": "zh-CN"
}
---

## 描述

FROM_DAYS 函数用于将一个整数天数转换为对应的日期（DATE 类型）。该函数以 “公元 1 年 1 月 1 日” 为基准（即天数 0 对应 0000-01-01），计算从基准日期开始经过指定天数后的日期。

注意：为与 MySQL 保持行为一致，FROM_DAYS 函数不支持 “公元 1 年 2 月 29 日”（0000-02-29），即使理论上该年份符合闰年规则，也会自动跳过该日期。
历史日期限制：该函数基于公历（格里高利历）扩展历法计算，不适用于 1582 年公历推行之前的日期（此时实际使用的是儒略历），可能导致结果与历史真实日期偏差。

该函数与 mysql 中的 [from_days 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_from-days) 行为一致

## 语法

```sql
FROM_DAYS(<days>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<days>` | 	输入的天数，为 `INT` 类型 |

## 返回值

返回值为 DATE 类型，格式为 YYYY-MM-DD，表示从基准日期（0000-01-01）开始经过 days 天后的日期。
- 若 days 为负数，返回错误。
- 若 days 超出有效日期范围（通常为 1 到 3652424，对应约公元 10000 年），返回错误

## 举例

```sql

---从基准日期开始计算天数
select from_days(730669),from_days(5),from_days(59), from_days(60);
+-------------------+--------------+---------------+---------------+
| from_days(730669) | from_days(5) | from_days(59) | from_days(60) |
+-------------------+--------------+---------------+---------------+
| 2000-07-03        | 0000-01-05   | 0000-02-28    | 0000-03-01    |
+-------------------+--------------+---------------+---------------+

---输入参数为负数，返回错误
select from_days(-60);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_days of -60 out of range

---输入 NULL ,返回 NULL
select from_days(NULL);
+-----------------+
| from_days(NULL) |
+-----------------+
| NULL            |
+-----------------+

---若 days 超出有效日期范围（通常为 1 到 3652424，对应约公元 10000 年），返回错误
select from_days(99999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_days of 99999999 out of range
```