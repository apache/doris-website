---
{
    "title": "MICROSECOND",
    "language": "en",
    "description": "Extracts the first six fractional-second digits from a DATETIME or TIMESTAMP_NS value without rounding."
}
---

## Description

The MICROSECOND function extracts the first six fractional-second digits from the input datetime value, returning a range from 0 to 999999. It supports DATETIME and TIMESTAMP_NS. Missing digits are padded with zeros; for TIMESTAMP_NS, the final three nanosecond digits are ignored. To obtain all nine digits, use [NANOSECOND](./nanosecond).


This function behaves the same as MySQL’s [microsecond function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_microsecond).

## Syntax

```sql
MICROSECOND(`<datetime>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<datetime>` | The input datetime value, of type DATETIME or TIMESTAMP_NS. For supported formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [timestamp_ns conversion](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md). |

## Return Value

Returns an INT type, representing the microsecond part of the datetime value. The range is 0 to 999999. For inputs with precision less than 6, missing digits are padded with zeros.

- If the input datetime does not contain a microsecond part (e.g., '2023-01-01 10:00:00'), returns 0.
- If the input is NULL, returns NULL.
- If the input datetime has microsecond precision less than 6 digits, missing digits are automatically padded with zeros (e.g., 12:34:56.123 is parsed as 123000 microseconds).
- For TIMESTAMP_NS, the function returns the first six fractional-second digits without rounding the final three digits.

## Examples

```sql

-- Extracts a value with 6-digit microseconds
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.000123' AS DATETIME(6)));
+----------------------------------------------------------------+
| MICROSECOND(CAST('1999-01-02 10:11:12.000123' AS DATETIME(6))) |
+----------------------------------------------------------------+
|                                                            123 |
+----------------------------------------------------------------+

-- Scale is 4
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.0123' AS DATETIME(4)));
+--------------------------------------------------------------+
| MICROSECOND(CAST('1999-01-02 10:11:12.0123' AS DATETIME(4))) |
+--------------------------------------------------------------+
|                                                        12300 |
+--------------------------------------------------------------+

-- Pads microsecond part with zeros (precision less than 6 digits)
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.123' AS DATETIME(6)));
+-------------------------------------------------------------+
| MICROSECOND(CAST('1999-01-02 10:11:12.123' AS DATETIME(6))) |
+-------------------------------------------------------------+
|                                                      123000 |
+-------------------------------------------------------------+

-- Datetime without scale returns 0
SELECT MICROSECOND(CAST('1999-01-02 10:11:12' AS DATETIME(6)));
+---------------------------------------------------------+
| MICROSECOND(CAST('1999-01-02 10:11:12' AS DATETIME(6))) |
+---------------------------------------------------------+
|                                                       0 |
+---------------------------------------------------------+

-- For TIMESTAMP_NS, the final three nanosecond digits are ignored
SELECT MICROSECOND(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS));
+-----------------------------------------------------------------------+
| MICROSECOND(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS)) |
+-----------------------------------------------------------------------+
|                                                                123456 |
+-----------------------------------------------------------------------+

-- When a string literal is valid for both datetime and time, prefer parsing it as time
SELECT MICROSECOND("22:12:12.123456");
+--------------------------------+
| MICROSECOND("22:12:12.123456") |
+--------------------------------+
|                         123456 |
+--------------------------------+

-- Input is NULL, returns NULL
SELECT MICROSECOND(NULL);
+-------------------+
| MICROSECOND(NULL) |
+-------------------+
|              NULL |
+-------------------+

```
