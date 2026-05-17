---
{
    "title": "AVG",
    "language": "zh-CN",
    "description": "计算指定列或表达式的所有非 NULL 值的平均值。"
}
---

## 描述

计算指定列或表达式的所有非 NULL 值的平均值。

## 语法

```sql
AVG([DISTINCT] <expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 是一个表达式或列，通常是一个数值列或者能够转换为数值的表达式，支持类型为 TinyInt，SmallInt，Integer，BigInt，LargeInt，Double，Decimal 。|
| `[DISTINCT]` | 是一个可选的关键字，表示对 expr 中的重复值进行去重后再计算平均值。 |

## 返回值

返回所选列或表达式的平均值，如果组内的所有记录均为 NULL，则该函数返回 NULL 。
对于 Decimal 类型的输入，返回值类型为 Decimal 。其他数值类型的返回值为 Double 。

## 举例

```sql
-- setup
create table t1(
        k_tinyint tinyint,
        k_smallint smallint,
        k_int int,
        k_bigint bigint,
        k_largeint largeint,
        k_double double,
        k_decimal decimalv3(10, 5),
        k_null_int int
) distributed by hash (k_int) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 10, 100, 1000, 10000, 1.1, 222.222, null),
    (2, 20, 200, 2000, 20000, 2.2, 444.444, null),
    (3, 30, 300, 3000, 30000, 3.3, null, null);
```

```sql
select avg(k_tinyint) from t1;
```

TinyInt 类型的平均值计算，[1,2,3]的平均值为2。

```text
+----------------+
| avg(k_tinyint) |
+----------------+
|              2 |
+----------------+
```

```sql
select avg(k_smallint) from t1;
```

SmallInt 类型的平均值计算，[10,20,30]的平均值为20。

```text
+-----------------+
| avg(k_smallint) |
+-----------------+
|              20 |
+-----------------+
```

```sql
select avg(k_int) from t1;
```

Integer 类型的平均值计算，[100,200,300]的平均值为200。

```text
+------------+
| avg(k_int) |
+------------+
|        200 |
+------------+
```

```sql
select avg(k_bigint) from t1;
```

BigInt 类型的平均值计算，[1000,2000,3000]的平均值为2000。

```text
+---------------+
| avg(k_bigint) |
+---------------+
|          2000 |
+---------------+
```

```sql
select avg(k_largeint) from t1;
```

LargeInt 类型的平均值计算，[10000,20000,30000]的平均值为20000。

```text
+-----------------+
| avg(k_largeint) |
+-----------------+
|           20000 |
+-----------------+
```

```sql
select avg(k_double) from t1;
```

Double 类型的平均值计算，[1.1,2.2,3.3]的平均值为2.2。

```text
| avg(k_double)      |
+--------------------+
| 2.1999999999999997 |
```

```sql
select avg(k_decimal) from t1;
```

Decimal 类型的平均值计算，[222.222,444.444,null]的平均值为333.333。

```text
+----------------+
| avg(k_decimal) |
+----------------+
|      333.33300 |
+----------------+
```

```sql
select avg(k_null_int) from t1;
```

对于输入数据均为 NULL 值的情况，返回 NULL 值。

```text
+-----------------+
| avg(k_null_int) |
+-----------------+
|            NULL |
+-----------------+
```

```sql
select avg(distinct k_bigint) from t1;
```

使用 DISTINCT 关键字进行去重计算，[1000,2000,3000]去重后平均值为2000。

```text
+-----------------------+
| avg(distinct k_bigint) |
+-----------------------+
|                  2000 |
+-----------------------+
```

