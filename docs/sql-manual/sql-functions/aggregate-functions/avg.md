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
| `<expr>` | It is an expression or column, typically a numeric column or an expression that can be converted to a numeric value. Supported types are TinyInt, SmallInt, Integer, BigInt, LargeInt, Double, Decimal. |
| `[DISTINCT]` | It is an optional keyword that indicates the calculation of the average value after removing duplicate values from expr. |

## Return Value

Returns the average value of the selected column or expression. If all records in the group are NULL, the function returns NULL.
For decimal type input, return value will be decimal as well, other numric type will return double type.

## Example

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

TinyInt type average calculation, the average of [1,2,3] is 2.

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

SmallInt type average calculation, the average of [10,20,30] is 20.

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

Integer type average calculation, the average of [100,200,300] is 200.

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

BigInt type average calculation, the average of [1000,2000,3000] is 2000.

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

LargeInt type average calculation, the average of [10000,20000,30000] is 20000.

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

Double type average calculation, the average of [1.1,2.2,3.3] is approximately 2.2.

```text
| avg(k_double)      |
+--------------------+
| 2.1999999999999997 |
```

```sql
select avg(k_decimal) from t1;
```

Decimal type average calculation, the average of [222.222,444.444,null] is 333.333.

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

For cases where all input data are NULL values, return NULL value.

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

Using the DISTINCT keyword for deduplication calculation, [1000,2000,3000] after deduplication has an average of 2000.

```text
+-----------------------+
| avg(distinct k_bigint) |
+-----------------------+
|                  2000 |
+-----------------------+
```

