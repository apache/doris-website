---
{
    "title": "GROUP_ARRAY_UNION",
    "language": "en",
    "description": "Find the unique union of all elements from every row in the input array and return a new array."
}
---

## Description

Find the unique union of all elements from every row in the input array and return a new array.

## Syntax

```sql
GROUP_ARRAY_UNION(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | An expression to calculate union, supported type: Array<Type>. Does not support complex type nesting within an Array. |

## Return Value

Returns an array containing the union results. If there is no valid data in the group, returns an empty array.

## Example


```sql
-- setup
CREATE TABLE group_array_union_test (
	id INT,
	c_array_string ARRAY<STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO group_array_union_test VALUES
	(1, ['a', 'b', 'c', 'd', 'e']),
	(2, ['a', 'b']),
	(3, ['a', null]),
	(4, NULL);
```

```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test;
```

```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| [null, "c", "e", "b", "d", "a"]   |
+-----------------------------------+
```

```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test where id in (3,4);
```

```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| [null, "a"]                       |
+-----------------------------------+
```

```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test where id in (4);
```

```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| []                                |
+-----------------------------------+
```


