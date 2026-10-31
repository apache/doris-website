---
{
    "title": "SECONDS_DIFF",
    "language": "en",
    "description": "The function calculates the time difference between two datetime values and returns the difference in seconds."
}
---

## Description

The function calculates the time difference between two datetime values and returns the difference in seconds.

## Syntax

```sql
SECONDS_DIFF(<end_datetime>, <start_datetime>)
```

## Parameters

| Parameter          | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `<end_datetime>`   | Required. The ending datetime value. Supports the DATETIME and DATE type.   |
| `<start_datetime>` | Required. The starting datetime value. Supports the DATETIME and DATE type. |

## Return Value
- Returns an integer representing the difference in seconds between two datetime values:
    - If `<end_datetime>` is later than `<start_datetime>`, returns a positive value.
    - If `<end_datetime>` is earlier than `<start_datetime>`, returns a negative value.
    - If `<end_datetime>` and `<start_datetime>` are equal, returns 0.
- If either parameter is NULL, the function returns NULL.
- If the input datetime values are invalid (e.g., 0000-00-00T00:00:00), the function returns NULL.

## Example
```sql
SELECT SECONDS_DIFF('2025-01-23 12:35:56', '2025-01-23 12:34:56');
```
```text
+----------------------------------------------------------------------------------------------------------+
| seconds_diff(cast('2025-01-23 12:35:56' as DATETIMEV2(0)), cast('2025-01-23 12:34:56' as DATETIMEV2(0))) |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                       60 |
+----------------------------------------------------------------------------------------------------------+
```
