---
{
    "title": "SQRT",
    "language": "en"
}
---

## Description

Returns the square root of a value, where the input value must be greater than or equal to 0.
If input value less than 0, return `NULL`.

## Aliases

- DSQRT

## Syntax

```sql
SQRT(<a>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | The value whose square root is to be calculated |

## Return Value

The square root of parameter a.

## Examples

```sql
select sqrt(9),sqrt(2)
```
```text
+-------------------------+-------------------------+
| sqrt(cast(9 as DOUBLE)) | sqrt(cast(2 as DOUBLE)) |
+-------------------------+-------------------------+
|                     3.0 |      1.4142135623730951 |
+-------------------------+-------------------------+
```

```sql
select sqrt(-1)
```
```text
+----------+
| sqrt(-1) |
+----------+
|     NULL |
+----------+
```