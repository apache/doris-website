---
{
    "title": "POW",
    "language": "en",
    "description": "Returns the value of the first argument raised to the power of the second argument."
}
---

## Description

Returns the value of the first argument raised to the power of the second argument.

## Alias

- POWER
- FPOW
- DPOW

## Syntax

```sql
POW(<a>, <b>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<a>`   | Base   |
| `<b>`   | Power  |

## Return value

Return an integer type or a floating-point type.

Special cases:

- If a `IS NULL` or b `IS NULL`, return `NULL`.
- If `b = 0` and a `IS NOT NULL`, it will always return `1`.

## Examples

```sql
select pow(2, 0);
```
```text
+-------------------------------------------+
| pow(cast(2 as DOUBLE), cast(0 as DOUBLE)) |
+-------------------------------------------+
|                                         1 |
+-------------------------------------------+
```

```sql
select pow(2, 10);
```
```text
+--------------------------------------------+
| pow(cast(2 as DOUBLE), cast(10 as DOUBLE)) |
+--------------------------------------------+
|                                       1024 |
+--------------------------------------------+
```

```sql
select pow(1.2, 2);
```
```text
+---------------------------------------------+
| pow(cast(1.2 as DOUBLE), cast(2 as DOUBLE)) |
+---------------------------------------------+
|                                        1.44 |
+---------------------------------------------+
```

```sql
select pow(1.2, 2.1);
```
```text
+-----------------------------------------------+
| pow(cast(1.2 as DOUBLE), cast(2.1 as DOUBLE)) |
+-----------------------------------------------+
|                            1.4664951016517147 |
+-----------------------------------------------+
```

```sql
select pow(2, null);
```
```text
+------------------------------+
| pow(cast(2 as DOUBLE), NULL) |
+------------------------------+
|                         NULL |
+------------------------------+
```

```sql
select pow(null, 2);
```
```text
+------------------------------+
| pow(NULL, cast(2 as DOUBLE)) |
+------------------------------+
|                         NULL |
+------------------------------+
```
