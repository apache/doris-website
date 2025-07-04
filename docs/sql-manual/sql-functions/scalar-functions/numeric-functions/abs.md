---
{
    "title": "ABS",
    "language": "en"
}
---

## Description

Returns the absolute value of `x`

## Syntax

```sql
ABS(<x>) 
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the absolute value is to be calculated |  

## Return Value  

The absolute value of parameter `x`. 

## Example

```sql
select abs(-2);
```

```text
+---------+
| abs(-2) |
+---------+
|       2 |
+---------+
```

```sql
select abs(3.254655654);
```

```text
+------------------+
| abs(3.254655654) |
+------------------+
|      3.254655654 |
+------------------+
```

```sql
select abs(-3254654236547654354654767);
```

```text
+---------------------------------+
| abs(-3254654236547654354654767) |
+---------------------------------+
| 3254654236547654354654767       |
+---------------------------------+
```
