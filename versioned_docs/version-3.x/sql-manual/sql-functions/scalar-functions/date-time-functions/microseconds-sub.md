---
{
    "title": "MICROSECONDS_SUB",
    "language": "en",
    "description": "Subtracts a specified number of microseconds from a datetime value and returns a new datetime value."
}
---

## Description

Subtracts a specified number of microseconds from a datetime value and returns a new datetime value.

## Syntax

```sql
MICROSECONDS_SUB(<basetime>, <delta>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<basetime>`  | The input datetime value, of type DATETIMEV2    |
| `<delta>`     | The number of microseconds to subtract, of type INT; 1 second = 1,000,000 microseconds |

## Return Value

Returns a value of type DATETIMEV2, representing the time value after subtracting the specified number of microseconds from the input datetime. The precision of the return value is the same as that of the input parameter basetime.

## Example

```sql
SELECT NOW(3) AS current_time, MICROSECONDS_SUB(NOW(3), 100000) AS after_sub;
```

```text
+-------------------------+----------------------------+
| current_time            | after_sub                  |
+-------------------------+----------------------------+
| 2025-01-16 11:52:22.296 | 2025-01-16 11:52:22.196000 |
+-------------------------+----------------------------+
```

**Note:**
- `NOW(3)` returns the current time with a precision of 3 decimal places.
- After subtracting 100000 microseconds (0.1 seconds), the time decreases by 0.1 seconds.
- The function's result is dependent on the precision of the input time.
