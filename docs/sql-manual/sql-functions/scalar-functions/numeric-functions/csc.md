---
{
    "title": "CSC",
    "language": "en"
}
---

## Description

Returns the cosecant of x, where x is the value in radians, only input and output are supported as double. Input null value will return null value.

## Syntax

```sql
CSC(<x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | The value for which the cosecant is to be calculated |

## Return Value

Returns a Double type value means the cosecant of x.

## Example

```sql
select csc(1),csc(2),csc(1000);
```

```text
+--------------------+--------------------+------------------+
| csc(1)             | csc(2)             | csc(1000)        |
+--------------------+--------------------+------------------+
| 1.1883951057781212 | 1.0997501702946164 | 1.20936599707935 |
+--------------------+--------------------+------------------+
```

Input null value.

```sql
select csc(null);
```

```text
+--------------------+
| csc(null)          |
+--------------------+
|      NULL          |
+--------------------+
```