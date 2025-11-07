---
{
    "title": "RANDOM",
    "language": "en"
}
---

## Description

Returns a random number between 0 and 1, or returns the required random number according to the parameters.

- Note: All parameters must be constants.

## Alias

- RAND

## Syntax

```sql
RANDOM() -- Generates a random number between 0 and 1

RANDOM(<seed>) -- Generates a fixed sequence of random numbers between 0 and 1 based on the seed value

RANDOM(<a> , <b>) -- Generates a random number between a and b
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<seed>` | random number generator seed. Returns a fixed sequence of random numbers between 0 and 1. |
| `<a>` | The lower bound of a random number. |
| `<b>` | The upper bound of a random number. It must be less than the lower bound. |

## Return value

- If no parameters are passed: Returns a random number between 0 and 1.

- If a single parameter seed is passed: Returns a fixed sequence of random numbers between 0 and 1.

- If two parameters a and b are passed: Returns a random integer between a and b.

## Example

```sql
select random();
```

```text
+--------------------+
| random()           |
+--------------------+
| 0.8047437125910604 |
+--------------------+
```

```sql
select rand(1.2);
```

```text
+---------------------+
| rand(1)             |
+---------------------+
| 0.13387664401253274 |
+---------------------+
```

```sql
select rand(-20, -10);
```

```text
+------------------+
| random(-20, -10) |
+------------------+
|              -10 |
+------------------+
```
