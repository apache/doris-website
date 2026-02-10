---
{
    "title": "ANY_VALUE",
    "language": "zh-CN",
    "description": "返回分组中表达式或列的任意一个值。如果存在非 NULL 值，返回任意非 NULL 值，否则返回 NULL。"
}
---

## 描述

返回分组中表达式或列的任意一个值。如果存在非 NULL 值，返回任意非 NULL 值，否则返回 NULL。

## 别名

- ANY

## 语法

```sql
ANY_VALUE(<expr>)
ANY(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要聚合的列或表达式，支持类型为 String，Date，DateTime，Timestamptz，IPv4，IPv6，Bool，TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal，Array，Map，Struct，AggState，Bitmap，HLL，QuantileState。 |

## 返回值

如果存在非 NULL 值，返回任意非 NULL 值，否则返回 NULL。
返回值的类型与输入的 expr 类型一致。

## 举例

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_decimal decimal(10, 2)
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple', 10.01),
    (1, 'banana', 20.02),
    (2, 'orange', 30.03),
    (2, null, null),
    (3, null, null);
```

```sql
select k1, any_value(k_string) from t1 group by k1;
```

String 类型：对于每个分组，返回任意一个非 NULL 值。

```text
+------+-------------------+
| k1   | any_value(k_string) |
+------+-------------------+
|    1 | apple             |
|    2 | orange            |
|    3 | NULL              |
+------+-------------------+
```


```sql
select k1, any_value(k_decimal) from t1 group by k1;
```

Decimal 类型：返回任意一个非 NULL 的高精度小数值。

```text
+------+--------------------+
| k1   | any_value(k_decimal) |
+------+--------------------+
|    1 |              10.01 |
|    2 |              30.03 |
|    3 |               NULL |
+------+--------------------+
```

```sql
select any_value(k_string) from t1 where k1 = 3;
```

当组内所有值都为 NULL 时，返回 NULL。

```text
+-------------------+
| any_value(k_string) |
+-------------------+
|              NULL |
+-------------------+
```

```sql
select k1, any(k_string) from t1 group by k1;
```

使用别名 ANY 的效果与 ANY_VALUE 相同。

```text
+------+---------------+
| k1   | any(k_string) |
+------+---------------+
|    1 | apple         |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```
