---
{
    "title": "SINH",
    "language": "en"
}
---

## Description

Returns the hyperbolic sine of `x`.

## Syntax

```sql
SINH(<x>)
```

## Parameters

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the hyperbolic sine value is to be calculated |  

## Return Value  

The sinh value of parameter `x`.

## Special Cases
- When `x` is NaN, returns NaN
- When `x` is positive infinity, returns Infinity
- When `x` is negative infinity, returns -Infinity
- When `x` is NULL, returns NULL

## Example

```sql
select sinh(0.0);
```

```
+-----------+
| sinh(0.0) |
+-----------+
|         0 |
+-----------+
```

```sql
select sinh(1.0);
```

```
+--------------------+
| sinh(1.0)          |
+--------------------+
| 1.1752011936438014 |
+--------------------+
```

```sql
select sinh(-1.0);
```

```
+---------------------+
| sinh(-1.0)          |
+---------------------+
| -1.1752011936438014 |
+---------------------+
```

```sql
select sinh(cast('nan' as double));
```
```
+------------------------------+
| sinh(cast('nan' AS DOUBLE))  |
+------------------------------+
| NaN                          |
+------------------------------+
```

```sql
select sinh(cast('inf' as double));
```
```
+------------------------------+
| sinh(cast('inf' AS DOUBLE))  |
+------------------------------+
| Infinity                     |
+------------------------------+
```

```sql
select sinh(cast('-inf' as double));
```
```
+-------------------------------+
| sinh(cast('-inf' AS DOUBLE))  |
+-------------------------------+
| -Infinity                     |
+-------------------------------+
```
