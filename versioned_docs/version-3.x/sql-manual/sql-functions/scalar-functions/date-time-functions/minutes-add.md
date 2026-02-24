---
{
    "title": "MINUTES_ADD",
    "language": "en",
    "description": "Adds a specified number of minutes to a datetime value and returns a new datetime value."
}
---

## Description

Adds a specified number of minutes to a datetime value and returns a new datetime value.

## Syntax

```sql
MINUTES_ADD(<datetime>, <minutes>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<datetime>`  | The input datetime value, which can be of type DATE, DATETIME, or DATETIMEV2 |
| `<minutes>`   | The number of minutes to add, of type INT; can be positive or negative |

## Return Value

Returns a value of type DATETIME, representing the datetime value after adding the specified number of minutes.

## Example

```sql
SELECT MINUTES_ADD("2020-02-02", 1);
```

```text
+-----------------------------------------------------+
| minutes_add(cast('2020-02-02' as DATETIMEV2(0)), 1) |
+-----------------------------------------------------+
| 2020-02-02 00:01:00                                 |
+-----------------------------------------------------+
```

**Note:**
- When the number of minutes added is negative, it effectively subtracts the corresponding number of minutes.
- The function automatically handles cases that cross hours and days.
- If the input parameter is NULL, the function returns NULL.
