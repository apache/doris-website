---
{
    "title": "ARRAY_ZIP",
    "language": "en",
    "description": "Merges all arrays into a single array. The resulting array contains corresponding elements from the source arrays,"
}
---

## Description

Merges all arrays into a single array. The resulting array contains corresponding elements from the source arrays, grouped in the order of the argument list.

## Syntax

```sql
ARRAY_ZIP(<array>[, <array> ])
```

## Parameters

| Parameter | Description |
|--|--|
| `<array>` | Input array |

## Return Value

Returns an array with the elements from the source array grouped into a structure. The data types in the structure are the same as the input array and are in the order in which the array was passed.

## Example

```sql
SELECT ARRAY_ZIP(['a', 'b', 'c'], [1, 2, 3]);
```

```text
+--------------------------------------------------------+
| array_zip(['a', 'b', 'c'], [1, 2, 3])                  |
+--------------------------------------------------------+
| [{"1":"a", "2":1}, {"1":"b", "2":2}, {"1":"c", "2":3}] |
+--------------------------------------------------------+
```
