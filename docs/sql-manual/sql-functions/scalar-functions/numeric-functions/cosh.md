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

## Special Cases
- When `x` is NaN, returns NaN
- When `x` is positive infinity, returns Infinity
- When `x` is negative infinity, returns Infinity
- When `x` is NULL, returns NULL

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

```sql
select cosh(cast('nan' as double));
```
```text
+-----------------------------+
| cosh(cast('nan' AS DOUBLE)) |
+-----------------------------+
| NaN                         |
+-----------------------------+
```

```sql
select cosh(cast('inf' as double));
```
```text
+-----------------------------+
| cosh(cast('inf' AS DOUBLE)) |
+-----------------------------+
| Infinity                    |
+-----------------------------+
```

```sql
select cosh(cast('-inf' as double));
```
```text
+------------------------------+
| cosh(cast('-inf' AS DOUBLE)) |
+------------------------------+
| Infinity                     |
+------------------------------+
```
