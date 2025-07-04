---
{
    "title": "TANH",
    "language": "en"
}
---

## Description

Returns the hyperbolic tangent of x.

## Syntax

```sql
TANH(<x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | The value for which the hyperbolic tangent is to be calculated |

## Return Value

The hyperbolic tangent of parameter x.

## Example

```sql
select tanh(0),tanh(1);
```

```text
+-------------------------+-------------------------+
| tanh(cast(0 as DOUBLE)) | tanh(cast(1 as DOUBLE)) |
+-------------------------+-------------------------+
|                       0 |      0.7615941559557649 |
+-------------------------+-------------------------+
```
