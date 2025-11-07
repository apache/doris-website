---
{
    "title": "SIN",
    "language": "en"
}
---

## Description

Calculate the sine of the parameter

## Syntax

```sql
SIN(<a>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | floating point number, the radian value of the parameter to calculate |

## Return Value

The sine of the parameter `<a>`, expressed in radians.

## Examples

```sql
select sin(1);
```

```text
+------------------------+
| sin(cast(1 as DOUBLE)) |
+------------------------+
|     0.8414709848078965 |
+------------------------+
```

```sql
select sin(0);
```

```text
+------------------------+
| sin(cast(0 as DOUBLE)) |
+------------------------+
|                    0.0 |
+------------------------+
```

```sql
select sin(Pi());
```

```text
+------------------------------------+
| sin(pi())                          |
+------------------------------------+
| 0.00000000000000012246467991473532 |
+------------------------------------+
```
