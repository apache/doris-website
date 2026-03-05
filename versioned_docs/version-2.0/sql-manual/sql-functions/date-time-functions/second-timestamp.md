---
{
    "title": "SECOND_TIMESTAMP",
    "language": "en"
}
---

## Description

The function converts a `DATETIME` value into a Unix timestamp (in seconds) starting from `1970-01-01 00:00:00 UTC`.


## Syntax

```sql
SECOND_TIMESTAMP(<datetime>)
```
## Parameters

| Parameter    | Description                                                         |
|--------------|---------------------------------------------------------------------|
| `<datetime>` | Required. The DATETIME value to be converted into a Unix timestamp. |

## Return Value
- Returns an integer representing the Unix timestamp (in seconds) corresponding to the input datetime value.
- If `<datetime>` is NULL, the function returns NULL.
- If `<datetime>` is out of valid range, the function may return an error or unexpected value.

## Example

```sql
SELECT SECOND_TIMESTAMP('2025-01-23 12:34:56');
```

```text
+----------------------------------------------------------------+
| second_timestamp(cast('2025-01-23 12:34:56' as DATETIMEV2(0))) |
+----------------------------------------------------------------+
|                                                     1737606896 |
+----------------------------------------------------------------+
```