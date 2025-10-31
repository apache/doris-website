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

## Special Cases
- When `x` is NaN, returns NaN
- When `x` is positive infinity, returns 1
- When `x` is negative infinity, returns -1
- When `x` is NULL, returns NULL

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

```sql
select tanh(cast('nan' as double));
```
```text
+-----------------------------+
| tanh(cast('nan' AS DOUBLE)) |
+-----------------------------+
| NaN                         |
+-----------------------------+
```

```sql
select tanh(cast('inf' as double));
```
```text
+-----------------------------+
| tanh(cast('inf' AS DOUBLE)) |
+-----------------------------+
| 1                           |
+-----------------------------+
```

```sql
select tanh(cast('-inf' as double));
```
```text
+------------------------------+
| tanh(cast('-inf' AS DOUBLE)) |
+------------------------------+
| -1                           |
+------------------------------+
```
