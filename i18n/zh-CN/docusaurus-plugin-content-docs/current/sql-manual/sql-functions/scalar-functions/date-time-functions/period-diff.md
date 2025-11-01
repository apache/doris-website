---
{
    "title": "PERIOD_DIFF",
    "language": "zh-CN"
}
---

## 描述
计算两个周期之间的月份差值。

该函数与 MySQL 的 [PERIOD_DIFF 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_period-diff) 行为一致。

## 语法

```sql
PERIOD_DIFF(`<period_1>`, `<period_2>`)
```

## 参数

| 参数            | 说明       |
|---------------|-------------------------------------------------------|
| `<period_1>` | 代表一个由年和月组成的周期。<ul><li>**格式**：月份固定占末尾两位，格式解读为 YYYYMM 或 YYMM。若使用 YYMM 格式，当 YY 小于 70 时会被解读为 20YY，当 YY 大于等于 70 时会被解读为 19YY。</li><li>**值范围**：接受 `[0, 2^63-1]` 范围内的整型参数，且最后两位（月份）必须在 `[1, 12]` 范围内。</li><li>**年份位数**：函数不限制年份部分的位数，这意味着年份可以超过四位。</li></ul> |
| `<period_2>` | 代表另一个周期，格式要求与 `<period_1>` 相同。 |

## 返回值

返回一个整型，表示`<period_1>` 的总月份数减去 `<period_2>` 的总月份数的值。

当任一参数为 NULL，因数值无法转换为 BIGINT 时，返回 NULL。

当参数为负数或其月份部分无效时，函数将报错。

## 举例

```sql
SELECT `period_1`, `period_2`, PERIOD_DIFF(`period_1`, `period_2`) AS DIFF FROM `test_period_diff`;
```
```text
+---------------------+----------+---------------------+
| period_1            | period_2 | DIFF                |
+---------------------+----------+---------------------+
| 200802              |   200703 |                  11 |
| 200703              |   200802 |                 -11 |
| 7001                |     6912 |               -1199 |
| NULL                |     2510 |                NULL |
| 2510                |     NULL |                NULL |
| 9223372036854775807 |      101 | 1106804644422549090 |
| 9223372036854775808 |      101 |                NULL |
+---------------------+----------+---------------------+
```
最后一行中period_1超出了BIGINT的上限(2^63-1), 故输出 NULL

```sql
SELECT PERIOD_DIFF(1, -1);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Period function got invalid period: -1
```