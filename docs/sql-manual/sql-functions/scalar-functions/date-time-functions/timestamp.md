---
{
    "title": "TIMESTAMP",
    "language": "en"
}
---

## Description

The TIMESTAMP function has two uses:

1. Convert a datetime string to a DATETIME type
2. Combine two arguments into a DATETIME type

## Syntax

```sql
TIMESTAMP(string)
TIMESTAMP(date, time)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `string`      | A datetime string |
| `date`     | A date value, which can be a DATE type or a properly formatted date string |
| `time`     | A time value, which can be a TIME type or a properly formatted time string |

## Return Value

Returns a value of type DATETIME.

## Example

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
-- Combine date and time into DATETIME
SELECT TIMESTAMP('2019-01-01', '12:00:00');
```

```text
+----------------------------------------+
| timestamp('2019-01-01', '12:00:00')    |
+----------------------------------------+
| 2019-01-01 12:00:00                    |
+----------------------------------------+
```
