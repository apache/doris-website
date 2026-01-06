---
{
    "title": "UNIFORM",
    "language": "zh-CN",
    "description": "使用给定的随机数种子，在特定范围内均匀采样生成随机数。"
}
---

## 描述

使用给定的随机数种子，在特定范围内均匀采样生成随机数。

## 语法

```sql
UNIFORM( <min> , <max> , <gen> )
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<min>` | 随机数的下限，接受数字类型，必须为字面量 |
| `<max>` | 随机数的上限，接受数字类型，必须为字面量 |
| `<gen>` | 整数，随机数种子，常用 [RANDOM](./random.md) 函数随机生成 |

## 返回值

返回在 `[<min>, <max>]` 范围内的随机数。如果 `<min>` 和 `<max>` 均为整数，则返回值类型为 `BIGINT`，否则返回值类型为 `DOUBLE`。

注意与 Snowflake 的[常见用法](https://docs.snowflake.com/en/sql-reference/functions/uniform)不同，由于 Doris 中 RANDOM 的函数返回值默认为 0-1 之间的浮点数，因此如果使用 `RANDOM()` 作为随机种子，应当附加乘数使其结果一个整数范围内分布。详情见示例。

## 举例

输入参数全为整数时，返回整数：

```sql
select uniform(-100, 100, random() * 10000) as result from numbers("number" = "10");
```

```text
+--------+
| result |
+--------+
|    -82 |
|    -79 |
|     21 |
|     19 |
|     50 |
|     53 |
|   -100 |
|    -67 |
|     46 |
|     40 |
+--------+
```

输入参数有非整数时，返回 double 类型：

```sql
select uniform(1, 100., random() * 10000) as result from numbers("number" = "10");
```

```text
+-------------------+
| result            |
+-------------------+
| 84.25057360297031 |
| 63.34296160793329 |
|  81.8770598286311 |
| 26.53334147605743 |
| 17.42787914185705 |
| 2.532901549399078 |
| 63.72223367924216 |
| 78.42165786093118 |
|   18.913688179943 |
| 41.73057334477316 |
+-------------------+
```

必须为字面量：

```sql
select uniform(1, unix_timestamp(), random() * 10000) as result from numbers("number" = "10");
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = The second parameter (max) of uniform function must be literal
```

必须为字面量：

```sql
select uniform(1, ksint, random()) from fn_test;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = The second parameter (max) of uniform function must be literal
```

固定的种子将产生固定的结果（`random()` 的结果在 0-1 之间分布，直接使用时 `uniform` 的种子参数始终为 `0`）：

```sql
select uniform(-100, 100, random()) as result from numbers("number" = "10");
```

```text
+--------+
| result |
+--------+
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
+--------+
```

当任意输入为 NULL 时，输出也为 NULL：

```sql
select uniform(-100, NULL, random() * 10000) as result from numbers("number" = "10");
```

```text
+--------+
| result |
+--------+
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
+--------+
```

```sql
select k0, uniform(0, 1000, k0) from it order by k0;
```

```text
+------+----------------------+
| k0   | uniform(0, 1000, k0) |
+------+----------------------+
| NULL |                 NULL |
|    1 |                  134 |
|    2 |                  904 |
|    3 |                  559 |
|    4 |                  786 |
|    5 |                  673 |
+------+----------------------+
```
