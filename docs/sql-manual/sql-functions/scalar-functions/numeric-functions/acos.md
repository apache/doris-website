---
{
    "title": "ACOS",
    "language": "en"
}
---

## Description

Returns the arc cosine of `x`, or `NULL` if `x` is not in the range `-1` to `1`.

## Syntax

```sql
ACOS(<x>)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the acos value is to be calculated |  

## Return Value  

The acos value of parameter `x`. 

## Example

```sql
select acos(1);
```

```text
+-----------+
| acos(1.0) |
+-----------+
|         0 |
+-----------+
```

```sql
select acos(0);
```

```text
+--------------------+
| acos(0.0)          |
+--------------------+
| 1.5707963267948966 |
+--------------------+
```

```sql
select acos(-2);
```

```text
+------------+
| acos(-2.0) |
+------------+
|        nan |
+------------+
```
