---
{
    "title": "PERIOD_ADD",
    "language": "zh-CN"
}
---

## 描述
为周期 `<period>` (格式为 YYYYMM 或 YYMM) 增加 `<month>` 个月，并以 YYYYMM 格式返回结果。

该函数与 MySQL 的 [PERIOD_ADD 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_period-add) 行为一致。

## 语法

```sql
PERIOD_ADD(`<period>`, `month`)
```

## 参数

| 参数            | 说明       |
|---------------|-------------------------------------------------------|
| `<period>` | 代表一个由年和月组成的周期。<ul><li>**格式**：月份固定占末尾两位，格式解读为 YYYYMM 或 YYMM。若使用 YYMM 格式，当 YY 小于 70 时会被解读为 20YY，当 YY 大于等于 70 时会被解读为 19YY。</li><li>**值范围**：接受 `[0, 2^63-1]` 范围内的整型参数，且最后两位（月份）必须在 `[1, 12]` 范围内。</li><li>**年份位数**：函数不限制年份部分的位数，这意味着年份可以超过四位。</li></ul> |
| `<month>` | 在 `<period>` 基础上需要增加的月份数。接受 `[-2^63, 2^63-1]` 范围内的整型。 |

## 返回值

返回一个整型，代表计算之后得到的周期。格式为YYYYMM。 同参数说明，年份部分不一定为四位数字。

当任一参数为 NULL，或 period 参数因数值无法转换为 BIGINT 时，返回 NULL。

当 `period` 参数为负数或其月份部分无效时，函数将报错。

## 举例

```sql
SELECT `period`, `month`, PERIOD_ADD(`period`, `month`) AS ans FROM test_period_add;
```
```text
+----------+--------+----------+
| period   | month  | ans      |
+----------+--------+----------+
|   200803 |      2 |   200805 |
|   200809 |      5 |   200902 |
|      803 |      2 |   200805 |
|     6910 |      3 |   207001 |
|     7001 |      1 |   197002 |
| 12345611 | 123456 | 13374411 |
|     NULL |     10 |     NULL |
|   202510 |   NULL |     NULL |
+----------+--------+----------+
```

```sql
-- 月份部分超出范围[1, 12]
SELECT PERIOD_ADD(202513, 1);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Period function got invalid period: 202513

-- period 超出BIGINT范围
SELECT PERIOD_ADD(-1, 1);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Period function got invalid period: -1
```

```sql
SELECT PERIOD_ADD(9223372036854775807, 1);
```
```text
+------------------------------------+
| PERIOD_ADD(9223372036854775807, 1) |
+------------------------------------+
|               -9223372036854775808 |
+------------------------------------+
```
解释: 在 Doris 内部使用int64_t进行计算，所以会存在数值溢出的情况，此行为与 MySQL 一致。
