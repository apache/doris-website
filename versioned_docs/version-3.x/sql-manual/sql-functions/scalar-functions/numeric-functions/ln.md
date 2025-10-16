---
{
    "title": "LN",
    "language": "en"
}
---

## Description

Returns the natural logarithm of `x` to base `e`.

## Alias

- DLOG1

## Syntax

```sql
LN(<x>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>`   | Antilogarithm should be greater than 0 |

## Return value

Return a float-point number. Special cases:

- If x IS NULL, return NULL

## Example

```sql
select ln(1);
```

```text
+-----------------------+
| ln(cast(1 as DOUBLE)) |
+-----------------------+
|                   0.0 |
+-----------------------+
```

```sql
select ln(e());
```

```text
+---------+
| ln(e()) |
+---------+
|     1.0 |
+---------+
```

```sql
select ln(10);
```

```text
+------------------------+
| ln(cast(10 as DOUBLE)) |
+------------------------+
|      2.302585092994046 |
+------------------------+
```