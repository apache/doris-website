---
{
    "title": "ANY_VALUE",
    "language": "en",
    "description": "Returns any value from the expression or column in the group. If there is a non-NULL value, it returns any non-NULL value; otherwise, it returns NULL."
}
---

## Description

Returns any value from the expression or column in the group. If there is a non-NULL value, it returns any non-NULL value; otherwise, it returns NULL.

## Alias

- ANY

## Syntax

```sql
ANY_VALUE(<expr>)
ANY(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The column or expression to be aggregated. Supported types are String, Date, DateTime, Timestamptz, IPv4, IPv6, Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Array, Map, Struct, AggState, Bitmap, HLL, QuantileState. |

## Return Value

Returns any non-NULL value if a non-NULL value exists, otherwise returns NULL.
The return type is consistent with the input expr type.

## Example

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

String type: For each group, returns any non-NULL value.

```text
+------+---------------------+
| k1   | any_value(k_string) |
+------+---------------------+
|    1 | apple               |
|    2 | orange              |
|    3 | NULL                |
+------+---------------------+
```

```sql
select k1, any_value(k_decimal) from t1 group by k1;
```

Decimal type: Returns any non-NULL high-precision decimal value.

```text
+------+----------------------+
| k1   | any_value(k_decimal) |
+------+----------------------+
|    1 |                10.01 |
|    2 |                30.03 |
|    3 |                 NULL |
+------+----------------------+
```

```sql
select any_value(k_string) from t1 where k1 = 3;
```

When all values in the group are NULL, returns NULL.

```text
+---------------------+
| any_value(k_string) |
+---------------------+
| NULL                |
+---------------------+
```

```sql
select k1, any(k_string) from t1 group by k1;
```

Using alias ANY, same effect as ANY_VALUE.

```text
+------+---------------+
| k1   | any(k_string) |
+------+---------------+
|    1 | apple         |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```
