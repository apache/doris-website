---
{
    "title": "ASIN",
    "language": "en",
    "description": "Returns the arc sine of x, or nan if x is not in the range -1 to 1."
}
---

## Description

Returns the arc sine of `x`, or `nan` if `x` is not in the range `-1` to `1`.

## Syntax

```sql
ASIN(<x>)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the asin value is to be calculated |  

## Return Value  

The asin value of parameter `x`. 

## Example

```sql
select asin(0.5);
```

```text
+---------------------+
| asin(0.5)           |
+---------------------+
| 0.52359877559829893 |
+---------------------+
```

```sql
select asin(2);
```

```text
+-----------+
| asin(2.0) |
+-----------+
|       nan |
+-----------+
```
