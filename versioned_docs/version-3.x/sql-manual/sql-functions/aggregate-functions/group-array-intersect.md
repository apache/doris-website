---
{
"title": "GROUP_ARRAY_INTERSECT",
"language": "en"
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
| `<expr>` | Array columns or array values that require intersection |

## Return Value

Returns an array containing the intersection results

## Example

```sql
select c_array_string from group_array_intersect_test where id in (18, 20);
```

```text
+------+---------------------------+
| id   | col                       |
+------+---------------------------+
|    1 | ["a", "b", "c", "d", "e"] |
|    2 | ["a", "b"]                |
|    3 | ["a", null]               |
+------+---------------------------+
```

```sql
select group_array_intersect(col) from group_array_intersect_test;
```

```text
+----------------------------+
| group_array_intersect(col) |
+----------------------------+
| ["a"]                      |
+----------------------------+
```

