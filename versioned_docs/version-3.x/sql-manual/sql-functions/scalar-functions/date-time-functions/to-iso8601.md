---
{
    "title": "TO_ISO8601",
    "language": "en",
    "description": "Converts a datetime value to an ISO8601 formatted string."
}
---

## Description

Converts a datetime value to an ISO8601 formatted string.

## Syntax

```sql
TO_ISO8601(<dt>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<dt>`      | The input datetime value, which can be of type DATETIME or DATE |

## Return Value

Returns a value of type VARCHAR, representing the datetime in ISO8601 format.

## Example

```sql
SELECT TO_ISO8601('2020-01-01 12:30:45');
```

```text
+-------------------------------------+
| to_iso8601('2020-01-01 12:30:45.0') |
+-------------------------------------+
| 2020-01-01T12:30:45                 |
+-------------------------------------+
```
