---
{
    "title": "REGR_INTERCEPT",
    "language": "zh-CN",
    "description": "REGRINTERCEPT 用于计算一组数值对的最小二乘拟合线性方程的截距。"
}
---

## Description
REGR_INTERCEPT 用于计算一组数值对的最小二乘拟合线性方程的截距。

## Syntax
```
REGR_INTERCEPT(y, x)
```

## Parameters
- `y` (数值类型)：因变量。
- `x` (数值类型)：自变量。

x 和 y 都支持基本数值类型。

## Returned values
返回数据类型：FLOAT64

函数返回线性回归直线的截距。

如果没有行，或者只有包含空值的行，函数返回 NULL。

## Examples
```sql
-- 示例 1：基本用法
SELECT regr_intercept(y, x) FROM test;

-- 示例 2：在查询中使用示例数据
SELECT * FROM test;
+------+------+------+
| id   | x    | y    |
+------+------+------+
|    1 |   18 |   13 |
|    3 |   12 |    2 |
|    5 |   10 |   20 |
|    2 |   14 |   27 |
|    4 |    5 |    6 |
+------+------+------+

SELECT regr_intercept(y, x) FROM test;
+----------------------+
| regr_intercept(y, x) |
+----------------------+
|    5.512931034482759 |
+----------------------+
```

## Usage notes
- 此函数会忽略任何包含空值的数值对。
- 在计算结果会导致除以零的情况下，函数将返回 NULL。

## Related functions
REGR_SLOPE, REGR_R2, REGR_COUNT, REGR_AVGX, REGR_AVGY

## References
有关线性回归函数的更多详细信息，请参阅 SQL 标准文档中关于聚合函数的部分。
