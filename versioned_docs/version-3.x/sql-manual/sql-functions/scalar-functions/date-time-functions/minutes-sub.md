---
{
    "title": "MINUTES_SUB",
    "language": "en",
    "description": "Subtracts a specified number of minutes from a datetime value and returns a new datetime value."
}
---

## Description

Subtracts a specified number of minutes from a datetime value and returns a new datetime value.

## Syntax

```sql
MINUTES_SUB(<date>, <minutes>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<datetime>`  | The input datetime value, which can be of type DATE, DATETIME, or DATETIMEV2 |
| `<minutes>`   | The number of minutes to subtract, of type INT; can be positive or negative |

## Return Value

Returns a value of type DATETIME, representing the datetime value after subtracting the specified number of minutes.

## Example

```sql
SELECT MINUTES_SUB("2020-02-02 02:02:02", 1);
```

```text
+--------------------------------------------------------------+
| minutes_sub(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+--------------------------------------------------------------+
| 2020-02-02 02:01:02                                          |
+--------------------------------------------------------------+
```

**Note:**
- When the number of minutes subtracted is negative, it effectively adds the corresponding number of minutes.
- The function automatically handles cases that cross hours and days.
- If the input parameter is NULL, the function returns NULL.
- The result retains the seconds portion of the original time.
