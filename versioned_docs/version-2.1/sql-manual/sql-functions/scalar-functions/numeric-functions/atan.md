---
{
    "title": "ATAN",
    "language": "en",
    "description": "Returns the arctangent of x, where x is in radians."
}
---

## Description

Returns the arctangent of `x`, where `x` is in radians.

## Syntax

```sql
ATAN(<x>)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the atan value is to be calculated |  

## Return Value  

The atan value of parameter `x`. 

## Example

```sql
select atan(0);
```

```text
+-----------+
| atan(0.0) |
+-----------+
|         0 |
+-----------+
```

```sql
select atan(2);
```

```text
+--------------------+
| atan(2.0)          |
+--------------------+
| 1.1071487177940904 |
+--------------------+
```
