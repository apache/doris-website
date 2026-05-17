---
{
    "title": "GROUP_ARRAY_INTERSECT",
    "language": "en",
    "description": "Calculate the intersection elements of the input array across all rows and return a new array."
}
---

## Description

Calculate the intersection elements of the input array across all rows and return a new array.

## Syntax

```sql
GROUP_ARRAY_INTERSECT(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | An expression to calculate intersection, supported type: Array. |

## Return Value

Returns an array containing the intersection results. If there is no valid data in the group, returns an empty array.

## Example

```sql
-- setup
CREATE TABLE group_array_intersect_test (
    id INT,
    c_array_string ARRAY<STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO group_array_intersect_test VALUES
    (1, ['a', 'b', 'c', 'd', 'e']),
    (2, ['a', 'b']),
    (3, ['a', null]);
```

```sql
select group_array_intersect(c_array_string) from group_array_intersect_test;
```

```text
+---------------------------------------+
| group_array_intersect(c_array_string) |
+---------------------------------------+
| ["a"]                                 |
+---------------------------------------+
```

```sql
select group_array_intersect(c_array_string) from group_array_intersect_test where id is null;
```

```text
+---------------------------------------+
| group_array_intersect(c_array_string) |
+---------------------------------------+
| []                                    |
+---------------------------------------+
```

