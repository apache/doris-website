---
{
    "title": "MILLISECONDS_SUB",
    "language": "en",
    "description": "Subtracts a specified number of milliseconds from a datetime value and returns a new datetime value."
}
---

## Description

Subtracts a specified number of milliseconds from a datetime value and returns a new datetime value.

## Syntax

```sql
MILLISECONDS_SUB(<basetime>, <delta>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<basetime>`  | The input datetime value, of type DATETIMEV2    |
| `<delta>`     | The number of milliseconds to subtract, of type INT; 1 second = 1,000 milliseconds = 1,000,000 microseconds |

## Return Value

Returns a value of type DATETIMEV2, representing the time value after subtracting the specified number of milliseconds from the input datetime. The precision of the return value is the same as that of the input parameter basetime.

## Example

```sql
SELECT MILLISECONDS_SUB('2023-09-08 16:02:08.435123', 1);
```

```text
+--------------------------------------------------------------------------+
| milliseconds_sub(cast('2023-09-08 16:02:08.435123' as DATETIMEV2(6)), 1) |
+--------------------------------------------------------------------------+
| 2023-09-08 16:02:08.434123                                               |
+--------------------------------------------------------------------------+
1 row in set (0.11 sec)
```

**Note:**
- In the example, after subtracting 1 millisecond, the time decreases from .435123 to .434123.
- 1 millisecond equals 1000 microseconds.
- The function's result is dependent on the precision of the input time; the example uses a precision of 6 decimal places.
- The result retains microsecond-level precision.
