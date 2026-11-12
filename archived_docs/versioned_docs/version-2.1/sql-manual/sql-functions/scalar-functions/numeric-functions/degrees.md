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