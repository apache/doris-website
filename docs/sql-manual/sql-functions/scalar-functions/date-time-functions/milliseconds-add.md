---
{
    "title": "MILLISECONDS_ADD",
    "language": "en",
    "description": "Adds a specified number of milliseconds to a DATETIME, TIMESTAMP_NS, or TIMESTAMPTZ value."
}
---

## Description

The `MILLISECONDS_ADD` function adds a specified number of milliseconds to a `DATETIME`, `TIMESTAMP_NS`, or `TIMESTAMPTZ` value and returns the resulting value with the same type.

## Syntax

```sql
MILLISECONDS_ADD(`<datetime>`, `<delta>`)
```

## Parameters

| Parameter    | Description                                                                                   |
|--------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | The input datetime value. Supports `DATETIME`, `TIMESTAMP_NS`, and `TIMESTAMPTZ`. For specific formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [TIMESTAMP_NS conversion](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md), and [TIMESTAMPTZ conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion). |
| `<delta>`    | The number of milliseconds to add, of type `BIGINT`. 1 second = 1,000 milliseconds = 1,000,000 microseconds. |

## Return Value

A `TIMESTAMP_NS` input returns `TIMESTAMP_NS` with fixed nine-digit fractional-second precision. Results are validated against the range of the return type; `TIMESTAMP_NS` uses its range of `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`.

Returns the same temporal type as the input, representing the result of adding the specified milliseconds to the base time.

- If `<delta>` is negative, the function behaves the same as subtracting the corresponding milliseconds from the base time (i.e., `MILLISECONDS_ADD(basetime, -n)` is equivalent to `MILLISECONDS_SUB(basetime, n)`).
- If the input is of `DATE` type (only includes year, month, and day), the default time part is set to `00:00:00.000`.
- If the calculation result exceeds the valid range of the `DATETIME` type (`0000-01-01 00:00:00` to `9999-12-31 23:59:59.999999`), an exception is thrown.
- If any parameter is `NULL`, the function returns `NULL`.

## Examples

```sql
-- Add one millisecond
SELECT MILLISECONDS_ADD('2023-09-08 16:02:08.435123', 1);

+---------------------------------------------------+
| MILLISECONDS_ADD('2023-09-08 16:02:08.435123', 1) |
+---------------------------------------------------+
| 2023-09-08 16:02:08.436123                        |
+---------------------------------------------------+

-- Negative milliseconds, subtracts the corresponding milliseconds from the datetime
SELECT MILLISECONDS_ADD('2023-05-01 10:00:00.800', -300);
+---------------------------------------------------+
| MILLISECONDS_ADD('2023-05-01 10:00:00.800', -300) |
+---------------------------------------------------+
| 2023-05-01 10:00:00.500000                        |
+---------------------------------------------------+

-- Input is of DATE type (default time is 00:00:00.000)
SELECT MILLISECONDS_ADD('2023-01-01', 1500);
+--------------------------------------+
| MILLISECONDS_ADD('2023-01-01', 1500) |
+--------------------------------------+
| 2023-01-01 00:00:01.500000           |
+--------------------------------------+

-- Calculation result exceeds the datetime range, throws an exception
SELECT MILLISECONDS_ADD('9999-12-31 23:59:59.999', 2000) AS after_add;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation milliseconds_add of 9999-12-31 23:59:59.999000, 2000 out of range

-- Any parameter is NULL, returns NULL
SELECT MILLISECONDS_ADD('2023-10-01 12:00:00.500', NULL) AS after_add;
+-----------+
| after_add |
+-----------+
| NULL      |
+-----------+

```
