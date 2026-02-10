---
{
    "title": "LOG2",
    "language": "en",
    "description": "Returns the natural logarithm of x to base 2."
}
---

## Description

Returns the natural logarithm of `x` to base `2`.

## Syntax

```sql
LOG2(<x>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>`   | Antilogarithm should be greater than 0 |

## Return value

Returns a floating-point number.

- If x IS NULL: return `NULL`

## Example

```sql
select log2(1);
```

```text
+-------------------------+
| log2(cast(1 as DOUBLE)) |
+-------------------------+
|                     0.0 |
+-------------------------+
```

```sql
select log2(2);
```

```text
+-------------------------+
| log2(cast(2 as DOUBLE)) |
+-------------------------+
|                     1.0 |
+-------------------------+
```

```sql
select log2(10);
```

```text
+--------------------------+
| log2(cast(10 as DOUBLE)) |
+--------------------------+
|       3.3219280948873626 |
+--------------------------+
```
