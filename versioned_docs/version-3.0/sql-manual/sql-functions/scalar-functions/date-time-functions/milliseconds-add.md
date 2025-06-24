---
{
    "title": "MILLISECONDS_ADD",
    "language": "en"
}
---

## Description

Adds a specified number of milliseconds to a datetime value and returns a new datetime value.

## Syntax

```sql
MILLISECONDS_ADD(<basetime>, <delta>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<basetime>`  | The input datetime value, of type DATETIMEV2    |
| `<delta>`     | The number of milliseconds to add, of type INT; 1 second = 1,000 milliseconds = 1,000,000 microseconds |

## Return Value

Returns a value of type DATETIMEV2, representing the time value after adding the specified number of milliseconds to the input datetime. The precision of the return value is the same as that of the input parameter basetime.

## Example

```sql
SELECT MILLISECONDS_ADD('2023-09-08 16:02:08.435123', 1);
```

```text
+--------------------------------------------------------------------------+
| milliseconds_add(cast('2023-09-08 16:02:08.435123' as DATETIMEV2(6)), 1) |
+--------------------------------------------------------------------------+
| 2023-09-08 16:02:08.436123                                               |
+--------------------------------------------------------------------------+
```

**Note:**
- In the example, after adding 1 millisecond, the time increases from .435123 to .436123.
- 1 millisecond equals 1000 microseconds.
- The function's result is dependent on the precision of the input time; the example uses a precision of 6 decimal places.
