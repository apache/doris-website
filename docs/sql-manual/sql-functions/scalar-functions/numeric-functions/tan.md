---
{
    "title": "TAN",
    "language": "en"
}
---

## Description

Returns the tangent of x, where x is the value in radians.

## Syntax

```sql
TAN(<x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | The value for which the tangent is to be calculated |

## Return Value

Returns the tangent of x.

## Example

```sql
select tan(0),tan(1),tan(-1);
```

```text
+------------------------+------------------------+-------------------------+
| tan(cast(0 as DOUBLE)) | tan(cast(1 as DOUBLE)) | tan(cast(-1 as DOUBLE)) |
+------------------------+------------------------+-------------------------+
|                      0 |     1.5574077246549023 |     -1.5574077246549023 |
+------------------------+------------------------+-------------------------+
```
