---
{
    "title": "MICROSECOND_TIMESTAMP",
    "language": "en"
}
---

## Description
The  function converts a `DATETIME` value into a Unix timestamp (in microseconds) starting from `1970-01-01 00:00:00 UTC`.


## Syntax

```sql
MICROSECOND_TIMESTAMP(<datetime>)
```
## Parameters

| Parameter    | Description                                                         |
|--------------|---------------------------------------------------------------------|
| `<datetime>` | Required. The DATETIME value to be converted into a Unix timestamp. |

## Return Value

- Returns an integer representing the Unix timestamp (in microseconds) corresponding to the input datetime value.
- If `<datetime>` is NULL, the function returns NULL.
- If `<datetime>` is out of valid range, the function may return an error or unexpected value.

## Example

```sql
SELECT MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456');
```

```text
+----------------------------------------------------------------------------+
| microsecond_timestamp(cast('2025-01-23 12:34:56.123456' as DATETIMEV2(6))) |
+----------------------------------------------------------------------------+
|                                                           1737606896123456 |
+----------------------------------------------------------------------------+
```