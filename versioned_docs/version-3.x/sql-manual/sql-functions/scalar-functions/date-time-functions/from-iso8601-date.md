---
{
    "title": "FROM_ISO8601_DATE | Date Time Functions",
    "language": "en",
    "description": "Converts an ISO8601 formatted date expression to a DATE type date expression."
}
---

## Description

Converts an ISO8601 formatted date expression to a DATE type date expression.

## Syntax

```sql
from_iso8601_date(<dt>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<dt>` | An ISO8601 formatted date |

## Return Value

A DATE type date expression.

## Examples

```sql
SELECT from_iso8601_date('0000-01'),from_iso8601_date('0000-W01'),from_iso8601_date('0000-059');
```

```text
+------------------------------+-------------------------------+-------------------------------+
| from_iso8601_date('0000-01') | from_iso8601_date('0000-W01') | from_iso8601_date('0000-059') |
+------------------------------+-------------------------------+-------------------------------+
| 0000-01-01                   | 0000-01-03                    | 0000-02-28                    |
+------------------------------+-------------------------------+-------------------------------+
```
