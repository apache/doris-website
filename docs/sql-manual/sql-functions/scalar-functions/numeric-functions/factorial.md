---
{
    "title": "FACTORIAL",
    "language": "en"
}
---

## Description

Returns the factorial of `x`, or `NULL` if `x` is not in the range `0` to `20` (including `0` and `20`).

## Syntax

```sql
FACTORIAL(<x>)
```

## Parameters

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the factorial is to be calculated |  

## Return Value  

The factorial value of parameter `x`.

## Special Cases

- When `x` equals 0, returns 1
- When `x` is not in the range [0, 20], returns `NULL`
- When `x` is NULL, returns NULL

## Examples

```sql
select factorial(0);
```

```text
+--------------+
| factorial(0) |
+--------------+
|            1 |
+--------------+
```

```sql
select factorial(-1);
```

```text
+---------------+
| factorial(-1) |
+---------------+
|          NULL |
+---------------+
```

```sql
select factorial(21);
```

```text
+---------------+
| factorial(21) |
+---------------+
|          NULL |
+---------------+
```

```sql
select factorial(20);
```

```text
+---------------------+
| factorial(20)       |
+---------------------+
| 2432902008176640000 |
+---------------------+
```

```sql
select factorial(NULL);
```

```text
+-----------------+
| factorial(NULL) |
+-----------------+
|            NULL |
+-----------------+
```
