---
{
"title": "COLLECT_SET",
"language": "en"
}
---

## Description

Aggregation function aggregates all unique values of the specified column, removes duplicate elements, and returns a set type result.

## Alias

- GROUP_UNIQ_ARRAY

## Syntax

```sql
COLLECT_SET(<expr> [,<max_size>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | An expression to determine the values to be placed into the array. Supported types: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, Timestamptz, IPV4, IPV6, String, Array, Map, Struct. |
| `<max_size>` | Optional parameter to limit the result array size to max_size elements. Supported type: Integer. |

## Return Value

Returns ARRAY type, containing all non-NULL values after deduplication. If there is no valid data in the group, returns an empty array.

## Example

```sql
-- setup
CREATE TABLE collect_set_test (
	k1 INT,
	k2 INT,
	k3 STRING
) DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO collect_set_test VALUES (1, 10, 'a'), (1, 20, 'b'), (1, 10, 'a'), (2, 100, 'x'), (2, 200, 'y'), (3, NULL, NULL);
```

```sql
select collect_set(k1),collect_set(k1,2) from collect_set_test;
```

```text
+-----------------+-------------------+
| collect_set(k1) | collect_set(k1,2) |
+-----------------+-------------------+
| [2, 1, 3]       | [2, 1]            |
+-----------------+-------------------+
```

```sql
select k1,collect_set(k2),collect_set(k3,1) from collect_set_test group by k1 order by k1;
```

```text
+------+-----------------+-------------------+
| k1   | collect_set(k2) | collect_set(k3,1) |
+------+-----------------+-------------------+
|    1 | [20, 10]        | ["a"]             |
|    2 | [200, 100]      | ["x"]             |
|    3 | []              | []                |
+------+-----------------+-------------------+
```
