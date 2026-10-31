---
{
    "title": "EXP",
    "language": "en",
    "description": "Returns x raised to the base e."
}
---

## Description

Returns `x` raised to the base `e`.

## Alias

- DEXP

## Syntax

```sql
EXP(<x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | independent variable |

## Return Value

Return a value of type double
- If the parameter has a null value, it returns NULL

## Example

```sql
select exp(2);
```

```text
+------------------+
| exp(2.0)         |
+------------------+
| 7.38905609893065 |
+------------------+
```

```
select exp(3.4);
```

```text
+--------------------+
| exp(3.4)           |
+--------------------+
| 29.964100047397011 |
+--------------------+
```
