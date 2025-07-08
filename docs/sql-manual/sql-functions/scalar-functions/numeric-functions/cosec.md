---
{
    "title": "COSEC",
    "language": "en"
}
---

## Description

Returns the cosecant of x, where x is the value in radians, only input and output are supported as double.

## Syntax

```sql
COSEC(<x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | The value for which the cosecant is to be calculated |

## Return Value

Returns the cosecant of x.

## Example

```sql
select cosec(1),cosec(2),cosec(1000);
```

```text
+--------------------+--------------------+------------------+
| cosec(1)           | cosec(2)           | cosec(1000)      |
+--------------------+--------------------+------------------+
| 1.1883951057781212 | 1.0997501702946164 | 1.20936599707935 |
+--------------------+--------------------+------------------+
```
