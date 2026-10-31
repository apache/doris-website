---
{
    "title": "SECONDS_SUB",
    "language": "en"
}
---

## Description

The function subtracts or adds a specified number of seconds to/from a given datetime value and returns the resulting
datetime.

## Syntax

```sql
SECONDS_SUB(<datetime>, <seconds>)
```

## Parameters

| Parameter    | Description                                                                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| `<datetime>` | Required. The input datetime value. Supports the DATETIME and DATE type.                                                                            |
| `<seconds>`  | Required. The number of seconds to subtract or add. Supports integers (INT). Positive numbers add seconds, while negative numbers subtract seconds. |

## Return Value
- Returns a datetime value of the same type as the input <datetime>.
- If `<datetime>` is NULL, the function returns NULL.
- If `<datetime>` is an invalid date (e.g., 0000-00-00T00:00:00), the function returns NULL.

## Examples

```
SELECT SECONDS_SUB('2025-01-23 12:34:56', 30),SECONDS_SUB('2025-01-23 12:34:56', -30);
```
```text
+---------------------------------------------------------------+----------------------------------------------------------------+
| seconds_sub(cast('2025-01-23 12:34:56' as DATETIMEV2(0)), 30) | seconds_sub(cast('2025-01-23 12:34:56' as DATETIMEV2(0)), -30) |
+---------------------------------------------------------------+----------------------------------------------------------------+
| 2025-01-23 12:34:26                                           | 2025-01-23 12:35:26                                            |
+---------------------------------------------------------------+----------------------------------------------------------------+
```