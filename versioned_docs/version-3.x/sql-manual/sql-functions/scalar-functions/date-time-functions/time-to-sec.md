---
{
    "title": "TIME_TO_SEC",
    "language": "en"
}
---

## Description
The function converts an input `TIME` or `DATETIME` value into the total time in seconds. If the input is of `DATETIME` type, the function automatically extracts the time part (`HH:MM:SS`).


## Syntax

```sql
TIME_TO_SEC(<time>)
```
## Parameters

| Parameter | Description                                                                                                                |
|-----------|----------------------------------------------------------------------------------------------------------------------------|
| `<time>`  | Required. Supports TIME or DATETIME values. If the input is DATETIME, the function extracts the time part for calculation. |

## Return Value
- Returns an integer representing the total seconds of the input time value.
- If `<time>`  is NULL, the function returns NULL.

## Example

```sql
SELECT TIME_TO_SEC('16:32:18'),TIME_TO_SEC('2025-01-01 16:32:18');
```
```text
+---------------------------------------+--------------------------------------------------+
| time_to_sec(cast('16:32:18' as TIME)) | time_to_sec(cast('2025-01-01 16:32:18' as TIME)) |
+---------------------------------------+--------------------------------------------------+
|                                 59538 |                                            59538 |
+---------------------------------------+--------------------------------------------------+
```