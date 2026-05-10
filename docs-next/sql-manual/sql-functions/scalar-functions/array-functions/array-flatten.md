---
{
    "title": "ARRAY_FLATTEN",
    "language": "en",
    "description": "Flatten a multidimensional array into one dimension."
}
---

## Description

Flatten a multidimensional array into one dimension.

## Syntax

```sql
array_flatten(<a>)
```

## Parameters

| Parameter | Description | 
| --- | --- |
| `<a>` | ARRAY array |

## Return Value

Returns the flattened array

## Example

```sql
mysql> select array_flatten([[1,2,3],[4,5]]);
+--------------------------------+
| array_flatten([[1,2,3],[4,5]]) |
+--------------------------------+
| [1, 2, 3, 4, 5]                |
+--------------------------------+
1 row in set (0.01 sec)

mysql> select array_flatten([[[[[[1,2,3,4,5],[6,7],[8,9],[10,11],[12]],[[13]]],[[[14]]]]]]);
+-------------------------------------------------------------------------------+
| array_flatten([[[[[[1,2,3,4,5],[6,7],[8,9],[10,11],[12]],[[13]]],[[[14]]]]]]) |
+-------------------------------------------------------------------------------+
| [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]                               |
+-------------------------------------------------------------------------------+
1 row in set (0.02 sec)
```
