---
{
    "title": "SEC_TO_TIME",
    "language": "en"
}
---

## Description
The `SEC_TO_TIME` function converts a value in seconds into a `TIME` type, returning the result in the format `HH:MM:SS`.  
The input seconds represent the time elapsed since the start of a day (`00:00:00`).


## Syntax

```sql
SEC_TO_TIME(<seconds>)
```
## Parameters

| Parameter     | Description                                                                                                                                           |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<seconds>` | Required. The input number of seconds, representing the time elapsed since the start of a day (00:00:00). Supports positive or negative integers. |

## Return Value
- Returns a TIME value in the format `HH:MM:SS`, representing the time calculated from the start of a day (00:00:00).
- If `<seconds>`  is NULL, the function returns NULL.

## Example
```sql
SELECT SEC_TO_TIME(59738);
```
```text
+--------------------+
| sec_to_time(59738) |
+--------------------+
| 16:35:38           |
+--------------------+
```