---
{
    "title": "SEC",
    "language": "en"
}
---

## Description

Returns the secant of x, where x is the value in radians.

## Syntax

```sql
SEC(<x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | The value for which the secant is to be calculated |

## Return Value

Returns the secant of x.

## Example

```sql
select sec(1),sec(2),sec(1000);
```

```text
+--------------------+--------------------+--------------------+
| sec(1)             | sec(2)             | sec(1000)          |
+--------------------+--------------------+--------------------+
| 1.8508157176809255 | -2.402997961722381 | 1.7781600385912715 |
+--------------------+--------------------+--------------------+
```
