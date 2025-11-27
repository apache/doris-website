---
{
    "title": "MICROSECOND",
    "language": "en"
}
---

## Description

The MICROSECOND function extracts the microsecond part (up to six digits after the decimal point) from the input datetime value, returning a range from 0 to 999999. This function supports processing DATETIME types with microsecond precision, and automatically pads zeros for inputs with insufficient precision.


This function behaves the same as MySQL’s [microsecond function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_microsecond).

## Syntax

```sql
MICROSECOND(`<datetime>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<datetime>` | The input datetime value, of type DATETIME. For datetime formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) . Precision must be greater than 0. |

## Return Value

Returns an INT type, representing the microsecond part of the datetime value. The range is 0 to 999999. For inputs with precision less than 6, missing digits are padded with zeros.

- If the input datetime does not contain a microsecond part (e.g., '2023-01-01 10:00:00'), returns 0.
- If the input is NULL, returns NULL.
- If the input datetime has microsecond precision less than 6 digits, missing digits are automatically padded with zeros (e.g., 12:34:56.123 is parsed as 123000 microseconds).

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
