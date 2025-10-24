---
{
    "title": "EXP",
    "language": "en"
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

Return a value of type double. Special cases:
- If the parameter is NULL, returns NULL
- When the parameter is quite large, returns Infinity

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

```sql
select exp(3.4);
```

```text
+--------------------+
| exp(3.4)           |
+--------------------+
| 29.964100047397011 |
+--------------------+
```

```sql
select exp(1000000);
```

```text
+--------------+
| EXP(1000000) |
+--------------+
|     Infinity |
+--------------+
```
