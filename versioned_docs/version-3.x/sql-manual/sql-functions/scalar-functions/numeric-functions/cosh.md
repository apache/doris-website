---
{
    "title": "COSH",
    "language": "en",
    "description": "Returns the hyperbolic cosine of x."
}
---

## Description

Returns the hyperbolic cosine of `x`.

## Syntax

`COSH(<x>)`

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | The value for which the hyperbolic cosine is to be calculated  |

## Return Value

The hyperbolic cosine of parameter `x`

## Examples

```sql
select cosh(0);
```
```text
+-------------------------+
| cosh(cast(0 as DOUBLE)) |
+-------------------------+
|                     1.0 |
+-------------------------+
```

```sql
select cosh(1);
```
```text
+-------------------------+
| cosh(cast(1 as DOUBLE)) |
+-------------------------+
|       1.543080634815244 |
+-------------------------+
```

```sql
select cosh(-1);
```
```text
+--------------------------+
| cosh(cast(-1 as DOUBLE)) |
+--------------------------+
|        1.543080634815244 |
+--------------------------+
```
