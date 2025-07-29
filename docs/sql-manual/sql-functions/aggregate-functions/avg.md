---
{
"title": "AVG",
"language": "en"
}
---

## Description

Calculates the average of all non-NULL values in a specified column or expression.

## Syntax

```sql
AVG([DISTINCT] <expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | It is an expression or column, typically a numeric column or an expression that can be converted to a numeric value. |
| `[DISTINCT]` | It is an optional keyword that indicates the calculation of the average value after removing duplicate values from expr. |

## Return Value

Returns the average value of the selected column or expression. If all records in the group are NULL, the function returns NULL.
For decimal type input, return value will be decimal as well, other numric type will return double type.

## Example

```sql
-- setup
create table t1(
        k1 int,
        kd decimalv3(10, 5),
        kstr varchar(100),
        kstr_invalid varchar(100),
        knull int,
        kbigint bigint
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 222.222, '1.5', 'test', null, 100),
    (2, 444.444, '2.5', '1', null, 100),
    (3, null, '3.5', '2', null, 1);
```


```sql
select avg(k1) from t1;
```

The average of [1,2,3] is 2.

```text
+---------+
| avg(k1) |
+---------+
|       2 |
+---------+
```


```sql
select avg(kd) from t1;
```

The average of [222.222,444.444,null] is 333.333.

```text
+-----------+
| avg(kd)   |
+-----------+
| 333.33300 |
+-----------+
```

```sql
select avg(kstr) from t1;
```

The input Varchar type will be implicitly converted to Double.
The average of [1.5,2.5,3.5] is 2.5.

```text
+-----------+
| avg(kstr) |
+-----------+
|       2.5 |
+-----------+
```

```sql
select avg(kstr_invalid) from t1;
```

Invalid strings will be converted to NULL values during implicit conversion.
The average of [null,1,2] is 1.5.

```text
+-------------------+
| avg(kstr_invalid) |
+-------------------+
|               1.5 |
+-------------------+
```

```sql
select avg(knull) from t1;
```

For cases where all input data are NULL values, return NULL value.

```text
+------------+
| avg(knull) |
+------------+
|       NULL |
+------------+
```

```sql
select avg(distinct kbigint) from t1;
```

After deduplication, [100,100,1] becomes [100,1], with an average of 50.5.

```text
+-----------------------+
| avg(distinct kbigint) |
+-----------------------+
|                  50.5 |
+-----------------------+
```

