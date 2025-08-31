---
{
  "title": "TO_DATE",
  "language": "en"
}
---

## Description
This function is equivalent to cast(string to date).
The TO_DATE function is used to convert datetime values to DATE type (containing only year, month, and day, in YYYY-MM-DD format). This function automatically ignores the time portion (hours, minutes, seconds, microseconds) from the input and extracts only the date portion for conversion.

## Syntax
```sql
TO_DATE(`<datetime_value>`)
```

## Parameters
| Parameter | Description |
|-----------|-------------|
| `<datetime_value>` | DATETIME type datetime value, supports DATETIME format, for datetime format please refer to [datetime conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) |

## Return Value

Returns DATE type.

## Examples

```sql
-- Extract the date part from datetime
select to_date("2020-02-02 00:00:00");

+--------------------------------+
| to_date('2020-02-02 00:00:00') |
+--------------------------------+
| 2020-02-02                     |
+--------------------------------+

-- Input date, returns itself
select to_date("2020-02-02");
+-----------------------+
| to_date("2020-02-02") |
+-----------------------+
| 2020-02-02            |
+-----------------------+

-- Invalid datetime, returns NULL
SELECT TO_DATE('2023-02-30 23:23:56') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Input NULL, returns NULL
SELECT TO_DATE(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```

