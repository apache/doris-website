---
{
    "title": "TIMESTAMP",
    "language": "en"
}
---

## Description

The TIMESTAMP function converts a datetime string to DATETIME type.

For specific datetime formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion).

This function differs from the [timestamp function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestamp) in MySQL. Doris currently does not support a second time parameter for datetime addition/subtraction.

## Syntax

```sql
TIMESTAMP(string)
```

## Parameters

| Parameter | Description                                           |
|-----------|-------------------------------------------------------|
| `string`  | Datetime string or datetime type                      |

## Return Value

Returns a value of type DATETIME.

- If the input is a date string, the time is set to 00:00:00
- If the input datetime is invalid, returns NULL
- If input is NULL, returns NULL

## Examples

```sql
-- Convert a string to DATETIME
SELECT TIMESTAMP('2019-01-01 12:00:00');
```

```text
+------------------------------------+
| timestamp('2019-01-01 12:00:00')   |
+------------------------------------+
| 2019-01-01 12:00:00                |
+------------------------------------+
```

```sql
-- Input date string
SELECT TIMESTAMP('2019-01-01');
+-------------------------+
| TIMESTAMP('2019-01-01') |
+-------------------------+
| 2019-01-01 00:00:00     |
+-------------------------+
```

```sql
-- If input datetime is invalid, returns NULL
SELECT TIMESTAMP('2019-01-41 12:00:00');
+----------------------------------+
| TIMESTAMP('2019-01-41 12:00:00') |
+----------------------------------+
| NULL                             |
+----------------------------------+

-- Input NULL, returns NULL
SELECT TIMESTAMP(NULL);
+-----------------+
| TIMESTAMP(NULL) |
+-----------------+
| NULL            |
+-----------------+
```
