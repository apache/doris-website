---
{
    "title": "MILLISECOND_TIMESTAMP",
    "language": "en",
    "description": "The MILLISECONDTIMESTAMP function converts a DATETIME value into a Unix timestamp (in milliseconds) starting from 1970-01-01 00:00:00 UTC."
}
---

## Description

The `MILLISECOND_TIMESTAMP` function converts a `DATETIME` value into a Unix timestamp (in milliseconds) starting from `1970-01-01 00:00:00 UTC`.


## Syntax

```sql
MILLISECOND_TIMESTAMP(<datetime>)
```
## Parameters

| Parameter    | Description                                                                           |
|--------------|---------------------------------------------------------------------------------------|
| `<datetime>` | Required. The DATETIME value to be converted into a Unix timestamp (in milliseconds). |

## Return Value

- Returns an integer representing the Unix timestamp (in milliseconds) corresponding to the input datetime value.
- If `<datetime>` is NULL, the function returns NULL.
- If `<datetime>` is out of valid range, the function may return an error or unexpected value.

## Example

```sql
SELECT MILLISECOND_TIMESTAMP('2025-01-23 12:34:56');
```
```text
+---------------------------------------------------------------------+
| millisecond_timestamp(cast('2025-01-23 12:34:56' as DATETIMEV2(0))) |
+---------------------------------------------------------------------+
|                                                       1737606896000 |
+---------------------------------------------------------------------+
```