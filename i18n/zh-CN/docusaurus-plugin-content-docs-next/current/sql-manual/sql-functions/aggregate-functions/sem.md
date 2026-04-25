---
{
    "title": "SEM",
    "language": "zh-CN",
    "description": "计算指定列或表达式的所有非 NULL 值的均值标准误。"
}
---

## 描述

计算指定列或表达式的所有非 NULL 值的均值标准误。

假设样本值为 $x_i$， 样本量为 $n$，样本均值为 $\bar{x}$：

$
\mathrm{SEM}=\sqrt{\frac{1}{n(n-1)}\sum_{i=1}^{n}\bigl(x_i-\bar{x}\bigr)^2}.
$

## 语法

```sql
SEM([DISTINCT] <expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 是一个表达式或列，通常是一个数值列或者能够转换为数值的表达式，支持类型为 Double。|
| `[DISTINCT]` | 是一个可选的关键字，表示对 expr 中的重复值进行去重后再计算均值标准误。 |

## 返回值

返回值为 Double。 返回所选列或表达式的均值标准误，如果组内的所有记录均为 NULL，则该函数返回 NULL 。

## 举例

```sql
-- setup
create table t1(
        id int,
        k_double double,
) distributed by hash (id) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 222.222),
    (2, 3.3),
    (3, 3.3),
    (4, null);
```

```sql
select sem(k_double) from t1;
```

Double 类型的均值标准误计算，[222.222,3.3,3.3,null]的均值标准误为72.974。

```text
+---------------+
| sem(k_double) |
+---------------+
|        72.974 |
+---------------+
```

```sql
select sem(id) from t1
```

Int 类型的均值标准误计算，[1,2,3,4]的均值标准误为0.645497。

```text
+--------------------+
| sem(id)            |
+--------------------+
| 0.6454972243679028 |
+--------------------+
```

```sql
select sem(cast(null as double)) from t1;
```

值全为null时，返回null。

```text
+---------------------------+
| sem(cast(null as double)) |
+---------------------------+
|                      NULL |
+---------------------------+
```

```sql
select sem(distinct k_double) from t1;
```

使用 DISTINCT 关键字进行去重计算，[222.222,3.3,3.3,null]去重后均值标准误为109.461。

```text
+------------------------+
| sem(distinct k_double) |
+------------------------+
|                109.461 |
+------------------------+
```
