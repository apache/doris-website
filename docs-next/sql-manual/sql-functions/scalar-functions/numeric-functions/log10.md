---
{
    "title": "LOG10",
    "language": "en",
    "description": "Returns the natural logarithm of x to base 10."
}
---

## Description

Returns the natural logarithm of `x` to base `10`.

## Alias

- DLOG10

## Syntax

```sql
LOG10(<x>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>`   | Antilogarithm should be greater than 0 |

## Return value

Returns a floating-point number. Special cases:

- If x IS NULL, return `NULL`
- If x IS NaN, return NaN

## Example

```sql
select log10(1);
```

```text
+--------------------------+
| log10(cast(1 as DOUBLE)) |
+--------------------------+
|                      0.0 |
+--------------------------+
```

```sql
select log10(10);
```

```text
+---------------------------+
| log10(cast(10 as DOUBLE)) |
+---------------------------+
|                       1.0 |
+---------------------------+
```

```sql
select log10(16);
```

```text
+---------------------------+
| log10(cast(16 as DOUBLE)) |
+---------------------------+
|        1.2041199826559248 |
+---------------------------+
```

```sql
select log10(NULL);
```

```text
+-------------+
| log10(NULL) |
+-------------+
|        NULL |
+-------------+
```

```sql
select log10(cast('nan' as double));
```

```text
+------------------------------+
| log10(cast('nan' as double)) |
+------------------------------+
|                          NaN |
+------------------------------+
```


