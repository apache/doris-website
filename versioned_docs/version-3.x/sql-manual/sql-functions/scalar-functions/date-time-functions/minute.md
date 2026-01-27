---
{
    "title": "MINUTE",
    "language": "en",
    "description": "Extracts the minute part from a datetime value. The returned value ranges from 0 to 59."
}
---

## Description

Extracts the minute part from a datetime value. The returned value ranges from 0 to 59.

## Syntax

```sql
MINUTE(<datetime>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<datetime>`  | The input datetime value, which can be of type DATE, DATETIME, DATETIMEV2, or TIME |

## Return Value

Returns an INT type representing the minute value, with a range of 0-59.

## Example

```sql
SELECT MINUTE('2018-12-31 23:59:59');
```

```text
+------------------------------------------------------+
| minute(cast('2018-12-31 23:59:59' as DATETIMEV2(0))) |
+------------------------------------------------------+
|                                                   59 |
+------------------------------------------------------+
```

**Note:**
- The input parameter can be of various time-related types.
- The returned value is always an integer between 0 and 59.
- If the input parameter is NULL, the function returns NULL.
