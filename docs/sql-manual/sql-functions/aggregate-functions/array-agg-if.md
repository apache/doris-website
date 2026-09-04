---
{
    "title": "ARRAY_AGG_IF",
    "language": "en",
    "description": "Concatenates the values of rows that meet a condition into an array, which can be used for conditional pivoting of rows into columns."
}
---

## Description

Concatenates the values (including null values) in a column into an array for the rows whose condition is true. Rows whose condition is false or null are skipped entirely.

## Syntax

```sql
ARRAY_AGG_IF(<cond>, <col>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<cond>` | A BOOLEAN expression that determines whether a row is collected. Rows where the condition is false or null are skipped. |
| `<col>` | An expression that determines the values to be placed into the array. Supported types: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, TimestampNs, Timestamptz, IPV4, IPV6, String, Array, Map, Struct. |

## Return Value

Returns a value of ARRAY type. Special cases:

- The order of elements in the array is not guaranteed.
- Null elements are kept: when the condition is true, a null value in `<col>` still becomes a null element in the result.
- Returns an empty array when no row satisfies the condition.

## Example

```sql
-- setup
CREATE TABLE test_doris_array_agg_if (
	c1 INT,
	c2 INT
) DISTRIBUTED BY HASH(c1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO test_doris_array_agg_if VALUES (1, 10), (1, 20), (1, 30), (2, 100), (2, 200), (3, NULL);
```

```sql
-- collect the values greater than 15 per group; the NULL-valued row of c1=3 is skipped
select c1, array_agg_if(c2 > 15, c2) from test_doris_array_agg_if group by c1;
```

```text
+------+------------------------+
| c1   | array_agg_if(c2 > 15, c2) |
+------+------------------------+
|    1 | [20, 30]               |
|    2 | [100, 200]             |
|    3 | []                     |
+------+------------------------+
```

```sql
-- a null element is kept when its row satisfies the condition
select c1, array_agg_if(c1 > 0, c2) from test_doris_array_agg_if group by c1;
```

```text
+------+----------------------+
| c1   | array_agg_if(c1 > 0, c2) |
+------+----------------------+
|    1 | [10, 20, 30]         |
|    2 | [100, 200]           |
|    3 | [null]               |
+------+----------------------+
```
