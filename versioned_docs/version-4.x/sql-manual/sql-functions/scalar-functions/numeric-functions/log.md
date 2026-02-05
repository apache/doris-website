---
{
    "title": "LOG",
    "language": "en",
    "description": "Returns the logarithm of x based on base b."
}
---

## Description

Returns the logarithm of `x` based on base `b`.

## Syntax

```sql
LOG(<b>[, <x>])
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<b>`     | Base should be greater than 0 and not be exactly 1.0 |
| `<x>`     | optional, Antilogarithm should be greater than 0, default value is e |

## Return value

Return a float point number. Special cases:

- If b IS NULL or x IS NULL, return NULL
- If any parameter is NaN, return NaN
- If parameters don't meet the input constraints, return NULL

## Example

```sql
select log(5,1);
```

```text
+---------------+
| log(5.0, 1.0) |
+---------------+
|             0 |
+---------------+
```

```sql
select log(3),ln(3);
```

```text
+--------------------+--------------------+
| log(3)             | ln(3)              |
+--------------------+--------------------+
| 1.0986122886681098 | 1.0986122886681098 |
+--------------------+--------------------+
```

```sql
select log(3,20);
```

```text
+--------------------+
| log(3.0, 20.0)     |
+--------------------+
| 2.7268330278608417 |
+--------------------+
```

```sql
select log(2,65536);
```

```text
+-------------------+
| log(2.0, 65536.0) |
+-------------------+
|                16 |
+-------------------+
```

```sql
select log(5,NULL);
```

```text
+------------------------------+
| log(cast(5 as DOUBLE), NULL) |
+------------------------------+
|                         NULL |
+------------------------------+
```

```sql
select log(NULL,3);
```

```text
+------------------------------+
| log(NULL, cast(3 as DOUBLE)) |
+------------------------------+
|                         NULL |
+------------------------------+
```

```sql
select log(2 ,cast('nan' as double));
```

```text
+-------------------------------+
| log(2 ,cast('nan' as double)) |
+-------------------------------+
|                           NaN |
+-------------------------------+
```

```sql
select log(2 ,-1);
```

```text
+------------+
| log(2 ,-1) |
+------------+
|       NULL |
+------------+
```