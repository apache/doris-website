---
{
    "title": "MAX",
    "language": "en"
}
---

## Description

The MAX function returns the maximum non-NULL value of the expression.

## Syntax

```sql
MAX(<expr>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<expr>` | The expression to get the value. Supported types are String, Time, Date, DateTime, IPv4, IPv6, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal. |

## Return Value

Returns the same data type as the input expression.
If all records in the group are NULL, the function returns NULL.


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
select k1, max(k_string) from t1 group by k1;
```

For String type: Returns the maximum string value for each group.

```text
+------+---------------+
| k1   | max(k_string) |
+------+---------------+
|    1 | banana        |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```

```sql
select k1, max(k_decimal) from t1 group by k1;
```

For Decimal type: Returns the maximum high-precision decimal value.

```text
+------+----------------+
| k1   | max(k_decimal) |
+------+----------------+
|    1 |          20.02 |
|    2 |          30.03 |
|    3 |           NULL |
+------+----------------+
```

```sql
select max(k_string) from t1 where k1 = 3;
```

When all values in the group are NULL, returns NULL.

```text
+---------------+
| max(k_string) |
+---------------+
| NULL          |
+---------------+
```

```sql
select max(k_string) from t1;
```

Returns the maximum value across all data.

```text
+---------------+
| max(k_string) |
+---------------+
| orange        |
+---------------+
```
