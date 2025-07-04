---
{
    "title": "MICROSECONDS_ADD",
    "language": "en"
}
---

## Description

Adds a specified number of microseconds to a datetime value and returns a new datetime value.

## Syntax

```sql
MICROSECONDS_ADD(<basetime>, <delta>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<basetime>`  | The input datetime value, of type DATETIMEV2    |
| `<delta>`     | The number of microseconds to add, of type INT; 1 second = 1,000,000 microseconds |

## Return Value

Returns a value of type DATETIMEV2, representing the time value after adding the specified number of microseconds to the input datetime. The precision of the return value is the same as that of the input parameter basetime.

## Example

```sql
SELECT NOW(3) AS current_time, MICROSECONDS_ADD(NOW(3), 100000) AS after_add;
```

```text
+-------------------------+----------------------------+
| current_time            | after_add                  |
+-------------------------+----------------------------+
| 2025-01-16 11:48:10.505 | 2025-01-16 11:48:10.605000 |
+-------------------------+----------------------------+
```

**Note:**
- `NOW(3)` returns the current time with a precision of 3 decimal places.
- After adding 100000 microseconds (0.1 seconds), the time increases by 0.1 seconds.
