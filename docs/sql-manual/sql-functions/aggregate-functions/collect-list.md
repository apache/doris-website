---
{
"title": "COLLECT_LIST",
"language": "en"
}
---

## Description

Aggregation function, used to aggregate all values of a column into an array.

## Alias

- GROUP_ARRAY

## Syntax

```sql
COLLECT_LIST(<expr> [,<max_size>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | An expression to determine the values to be placed into the array. Supported types: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, Timestamptz, IPV4, IPV6, String, Array, Map, Struct. |
| `<max_size>` | Optional parameter to limit the result array size to max_size elements. Supported type: Integer. |

## Return Value

Returns ARRAY type, containing all non-NULL values. If there is no valid data in the group, returns an empty array.

## Example

```sql
-- setup
CREATE TABLE collect_list_test (
	k1 INT,
	k2 INT,
	k3 STRING
) DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO collect_list_test VALUES (1, 10, 'a'), (1, 20, 'b'), (1, 30, 'c'), (2, 100, 'x'), (2, 200, 'y'), (3, NULL, NULL);
```

```sql
select collect_list(k1),collect_list(k1,3) from collect_list_test;
```

```text
+--------------------+--------------------+
| collect_list(k1)   | collect_list(k1,3) |
+--------------------+--------------------+
| [1, 1, 1, 2, 2, 3] | [1, 1, 1]          |
+--------------------+--------------------+
```

```sql
select k1,collect_list(k2),collect_list(k3,1) from collect_list_test group by k1 order by k1;
```

```text
+------+------------------+--------------------+
| k1   | collect_list(k2) | collect_list(k3,1) |
+------+------------------+--------------------+
|    1 | [10, 20, 30]     | ["a"]              |
|    2 | [100, 200]       | ["x"]              |
|    3 | []               | []                 |
+------+------------------+--------------------+
```
