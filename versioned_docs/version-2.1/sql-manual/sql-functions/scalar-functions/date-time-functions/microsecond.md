---
{
    "title": "MICROSECOND",
    "language": "en"
}
---

## Description

Extracts the microsecond part from a datetime value. The returned range is from 0 to 999999.

## Syntax

```sql
MICROSECOND(<date>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<date>`      | The input datetime value, of type DATETIMEV2, with a precision greater than 0 |

## Return Value

Returns an INT type representing the microsecond part of the datetime value. The range is from 0 to 999999. For inputs with a precision less than 6, the missing digits are padded with zeros.

## Example

```sql
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.000123' AS DATETIMEV2(6))) AS microsecond;
```

```text
+-------------+
| microsecond |
+-------------+
|         123 |
+-------------+
```
