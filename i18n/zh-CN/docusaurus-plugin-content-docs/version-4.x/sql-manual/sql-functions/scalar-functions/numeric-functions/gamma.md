---
{
    "title": "GAMMA",
    "sidebar_label": "GAMMA（4.x 暂不支持）",
    "language": "zh-CN",
    "description": "GAMMA 未发布候选实现的数学定义、DOUBLE 类型、NULL 和特殊数值行为；当前 4.x 暂不支持。",
    "keywords": [
        "GAMMA",
        "Gamma function",
        "伽马函数",
        "DOUBLE",
        "NULL"
    ]
}
---

## 描述

`GAMMA(<x>)` 的候选实现计算实数参数的伽马函数 `Γ(x)`，它将阶乘推广到正整数之外；正整数满足 `Γ(n) = (n - 1)!`。候选实现中，NULL 输入、零和负整数极点返回 NULL；负非整数可以返回有效数值。

:::caution 版本状态
当前 4.x（4.0、4.1 和 4.2 对应源码分支）均未实现 GAMMA，也没有已合入的回移。下方语法和结果仅说明开发候选实现，不能在当前 4.x 中执行。本页按[实现 PR apache/doris#68029](https://github.com/apache/doris/pull/68029) 的[候选提交 `1197c62327b8`](https://github.com/apache/doris/tree/1197c62327b83898337267e8be15898977072c08) 核对；首次支持版本必须在实现合入及实际回移后确认。
:::

对 `x > 0`，数学定义为 `Γ(x) = ∫₀^∞ t^(x-1) exp(-t) dt`。负非整数通过解析延拓定义，并满足递推关系 `Γ(x + 1) = x Γ(x)`；`0, -1, -2, ...` 是极点。特别地，`Γ(1) = Γ(2) = 1`，`Γ(0.5) = √π`。

## 语法

```sql
GAMMA(<x>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<x>` | 必填，`DOUBLE` 数值表达式，允许 NULL。整数、FLOAT、DECIMAL 等可转换的数值输入先按常规类型转换规则转为 DOUBLE，再计算；可用 `CAST(... AS DOUBLE)` 明确转换。 |

没有可选参数或其他重载。不能将隐式转换后的 DOUBLE 精度当作原始 DECIMAL 或大整数精度：极点判定也基于转换后的值，接近负整数的高精度输入可能因舍入而变成极点。非数值输入是否可转换遵循 Doris 的类型转换规则。

## 返回值

候选实现返回 `Nullable(DOUBLE)`。以下规则作用于转换后的 DOUBLE 参数；NULL、NaN 和 Infinity 的含义不同：

| 输入或情况 | 候选返回结果 |
| --- | --- |
| NULL | NULL |
| `+0.0`、`-0.0` | NULL |
| 负整数 | NULL |
| 负无穷 | NULL |
| NaN | NaN |
| 正无穷 | 正 Infinity |
| 正数或负非整数，结果可表示 | 伽马函数的 DOUBLE 近似值 |
| 有效有限参数的结果上溢 | 对应符号的 Infinity，不转为 NULL |
| 有效有限参数的结果下溢 | 次正规数或带符号零，不转为 NULL |

候选实现使用双精度浮点计算，数学恒等式不保证逐位精确。例如 `Γ(5)` 的数学值是 24，但最后几位可能随运行平台的数学库不同而变化。比较有限结果时使用容差；下方普通数值示例通过 ROUND 将有限数值舍入到小数点后六位，避免依赖平台末位差异。非有限值示例使用 ISNAN、ISINF、SIGNBIT 和 IS NULL 判定，避免依赖客户端对 NaN 或无穷值的打印方式。

不能简单把 `x < 172` 当作有限结果的保证：`171.5` 仍为有限值，`171.8` 和 `172` 已上溢；接近零时 `Γ(x)` 近似 `1/x`，极小的非零参数也可能上溢。较大负非整数可能下溢为带符号零，且次正规数不能一概当作零。

## 示例

以下预期结果仅适用于包含候选实现的开发构建。它们不是当前 master 或 4.x 已支持的声明。示例均为独立 SELECT，不需要建表。

### 正整数

```sql
SELECT GAMMA(1) AS gamma_1, GAMMA(2) AS gamma_2,
       ROUND(GAMMA(5), 6) AS gamma_5;
```

```text
gamma_1  gamma_2  gamma_5
1        1        24
```

### 正非整数与数值类型转换

```sql
SELECT ROUND(GAMMA(0.5), 6) AS gamma_half,
       ROUND(GAMMA(CAST(3.5 AS DECIMAL(3, 1))), 6) AS gamma_decimal;
```

```text
gamma_half  gamma_decimal
1.772454    3.323351
```

### 负非整数

```sql
SELECT ROUND(GAMMA(-0.5), 6) AS gamma_negative_half,
       ROUND(GAMMA(-1.5), 6) AS gamma_negative_one_half,
       ROUND(GAMMA(-2.5), 6) AS gamma_negative_two_half;
```

```text
gamma_negative_half  gamma_negative_one_half  gamma_negative_two_half
-3.544908            2.363272                 -0.945309
```

### 零、负零与负整数极点

```sql
SELECT GAMMA(0) AS zero_pole,
       GAMMA(CAST('-0.0' AS DOUBLE)) AS negative_zero_pole,
       GAMMA(-1) AS negative_one_pole,
       GAMMA(-2) AS negative_two_pole;
```

```text
zero_pole  negative_zero_pole  negative_one_pole  negative_two_pole
NULL       NULL                NULL               NULL
```

### NULL 输入

```sql
SELECT GAMMA(NULL) AS null_input;
```

```text
null_input
NULL
```

### NaN 和无穷值

```sql
SELECT ISNAN(GAMMA(CAST('nan' AS DOUBLE))) AS nan_propagates,
       ISINF(GAMMA(CAST('inf' AS DOUBLE))) AS positive_infinity,
       GAMMA(CAST('-inf' AS DOUBLE)) IS NULL AS negative_infinity_is_null;
```

```text
nan_propagates  positive_infinity  negative_infinity_is_null
1               1                  1
```

### 较大正数与上溢

```sql
SELECT GAMMA(171.5) < 1.7e308 AS finite_before_overflow,
       ISINF(GAMMA(171.8)) AS overflow_171_8,
       ISINF(GAMMA(172)) AS overflow_172;
```

```text
finite_before_overflow  overflow_171_8  overflow_172
1                       1               1
```

### 接近零的参数

```sql
SELECT GAMMA(1e-300) > 1e299 AS large_finite_result,
       ISINF(GAMMA(1e-320)) AS positive_overflow,
       ISINF(GAMMA(-1e-320)) AS negative_overflow,
       SIGNBIT(GAMMA(-1e-320)) AS negative_overflow_sign,
       ISINF(GAMMA(5e-324)) AS smallest_subnormal_overflow;
```

```text
large_finite_result  positive_overflow  negative_overflow  negative_overflow_sign  smallest_subnormal_overflow
1                    1                  1                  1                       1
```

### 非零次正规数结果

```sql
SELECT GAMMA(-171.5) > 0 AS positive_result,
       GAMMA(-171.5) < 2.2250738585072014e-308 AS below_min_normal;
```

```text
positive_result  below_min_normal
1                1
```

### 下溢为带符号零

```sql
SELECT GAMMA(-1000.5) = 0 AS zero_result,
       SIGNBIT(GAMMA(-1000.5)) AS negative_sign;
```

```text
zero_result  negative_sign
1            1
```
