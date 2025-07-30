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
