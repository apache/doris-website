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

For specific datetime formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion).

This function differs from the [timestamp function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestamp) in MySQL. Doris currently does not support a second time parameter for datetime addition/subtraction.

## Syntax

```sql
TIMESTAMP(string)
```

## Parameters

| Parameter | Description                                           |
|-----------|-------------------------------------------------------|
| `string`  | Datetime string type                      |

## Return Value

Returns a value of type DATETIME.

- If the input is a date string, the time is set to 00:00:00
- If input is NULL, returns NULL

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
```

