---
{
    "title": "DEGREES",
    "language": "en",
    "description": "Input a double-precision floating-point number and convert it from radians to degrees."
}
---

## Description

Input a double-precision floating-point number and convert it from radians to degrees.

- When the parameter is NULL, return NULL.

## Syntax

```sql
DEGREES(<a>)
```

## Parameters

| parameter | explain |
| -- | -- |
| `<a>` | The value that needs to be converted from radians to degrees. |

## Return Value

The angle of parameter a.

- When the parameter is NULL, return NULL.

## Special Cases
- When `a` is NaN, returns NaN
- When `a` is positive infinity, returns Infinity
- When `a` is negative infinity, returns -Infinity
- When `a` is NULL, returns NULL

## Examples

```sql
select degrees(3.14),degrees(1),degrees(-1),degrees(NULL)
```

```text
+-------------------------------+----------------------------+-----------------------------+---------------+
| degrees(cast(3.14 as DOUBLE)) | degrees(cast(1 as DOUBLE)) | degrees(cast(-1 as DOUBLE)) | degrees(NULL) |
+-------------------------------+----------------------------+-----------------------------+---------------+
|             179.9087476710785 |          57.29577951308232 |          -57.29577951308232 |          NULL |
+-------------------------------+----------------------------+-----------------------------+---------------+
```

```sql
select degrees(cast('nan' as double));
```

```text
+-------------------------------+
| degrees(cast('nan' AS DOUBLE))|
+-------------------------------+
| NaN                           |
+-------------------------------+
```

```sql
select degrees(cast('inf' as double));
```

```text
+-------------------------------+
| degrees(cast('inf' AS DOUBLE))|
+-------------------------------+
| Infinity                      |
+-------------------------------+
```

```sql
select degrees(cast('-inf' as double));
```

```text
+--------------------------------+
| degrees(cast('-inf' AS DOUBLE))|
+--------------------------------+
| -Infinity                      |
+--------------------------------+
```