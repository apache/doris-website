---
{
    "title": "COUNTEQUAL",
    "language": "en",
    "description": "Determine the number of value elements in the array"
}
---

## Description

Determine the number of value elements in the array

## Syntax

```sql
COUNTEQUAL(<arr>, <value>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<arr>` | Input arrayd |
| `<value>` | Judging elements |

## Return Value

The returned judgment results are as follows: num: the number of value in array; 0: value does not exist in array arr; NULL: if the array is NULL.

## Example

```sql
SELECT COUNTEQUAL(NULL,1),COUNTEQUAL([1, 2, 3, 'c'],2),COUNTEQUAL([],'b');
```

```text
+---------------------+---------------------------------------------------+------------------------------------------+
| countequal(NULL, 1) | countequal(['1', '2', '3', 'c'], cast(2 as TEXT)) | countequal(cast([] as ARRAY<TEXT>), 'b') |
+---------------------+---------------------------------------------------+------------------------------------------+
|                NULL |                                                 1 |                                        0 |
+---------------------+---------------------------------------------------+------------------------------------------+
```
