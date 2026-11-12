---
{
    "title": "ATAN2",
    "language": "en",
    "description": "Returns the arc tangent of 'y' / 'x'."
}
---

## Description

Returns the arc tangent of 'y' / 'x'.

## Syntax

```sql
ATAN2(<y>, <x>)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value representing the horizontal distance (coordinate) from the origin (0,0) along the x-axis. |  
| `<y>` | The value representing the vertical distance (coordinate) from the origin (0,0) along the y-axis. |  

## Return Value  

The atan2 value of parameter `y` / `x`. 

## Example

```sql
select atan2(0.1, 0.2);
```

```text
+---------------------+
| atan2(0.1, 0.2)     |
+---------------------+
| 0.46364760900080609 |
+---------------------+
```

```sql
select atan2(1.0, 1.0);
```

```text
+---------------------+
| atan2(1.0, 1.0)     |
+---------------------+
| 0.78539816339744828 |
+---------------------+
```
