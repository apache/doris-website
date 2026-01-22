---
{
    "title": "TIMESTAMP | Date Time Functions",
    "language": "en",
    "description": "The TIMESTAMP function converts a datetime format string to DATETIME type.",
    "sidebar_label": "TIMESTAMP"
}
---

# TIMESTAMP

## Description

The TIMESTAMP function converts a datetime format string to DATETIME type.
If a second time parameter exists, it calculates the sum of the two parameters and returns the result in DATETIME format.

For specific datetime formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion).

This function behaves the same way as the [timestamp function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestamp) in MySQL. 

:::note
Two parameter versions are supported from 4.0.3
:::

## Syntax

```sql
TIMESTAMP(<date_or_datetime_string>[, <time_string>])
```

## Parameters

| Parameter | Description                                           |
|-----------|-------------------------------------------------------|
| `date_or_datetime_string` | Date or datetime string type |
| `time_string` | Time string type |

## Return Value

Returns a value of type DATETIME.

When one parameter is provided, returns the result of converting the first parameter to DATETIME type.
When two parameters are provided, returns the sum of the two parameters.

- If the first parameter is a date string, the time is set to 00:00:00
- If any parameter is NULL or parameter type does not match, returns NULL

## Examples

```sql
-- Convert a string to DATETIME
SELECT TIMESTAMP('2019-01-01 12:00:00');

+------------------------------------+
| timestamp('2019-01-01 12:00:00')   |
+------------------------------------+
| 2019-01-01 12:00:00                |
+------------------------------------+

-- Input date string
SELECT TIMESTAMP('2019-01-01');
+-------------------------+
| TIMESTAMP('2019-01-01') |
+-------------------------+
| 2019-01-01 00:00:00     |
+-------------------------+

-- Input NULL, returns NULL
SELECT TIMESTAMP(NULL);
+-----------------+
| TIMESTAMP(NULL) |
+-----------------+
| NULL            |
+-----------------+

-- Two parameters, returns the sum of the two parameters (Date/DateTime + Time)
SELECT TIMESTAMP('2025-11-30 23:45:12', '12:34:56');
+----------------------------------------------+
| TIMESTAMP('2025-11-30 23:45:12', '12:34:56') |
+----------------------------------------------+
| 2025-12-01 12:20:08                          |
+----------------------------------------------+

-- The first parameter only accepts Date/Datetime type, the second parameter only accepts Time type
SELECT TIMESTAMP('12:34:56', '12:34:56');
+-----------------------------------+
| TIMESTAMP('12:34:56', '12:34:56') |
+-----------------------------------+
| NULL                              |
+-----------------------------------+

-- If any parameter is NULL, returns NULL
SELECT TIMESTAMP('2025-12-01', NULL);
+-------------------------------+
| TIMESTAMP('2025-12-01', NULL) |
+-------------------------------+
| NULL                          |
+-------------------------------+
```

