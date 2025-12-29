---
{
    "title": "TIMEDIFF",
    "language": "en",
    "description": "The TIMEDIFF function calculates the difference between two datetime values."
}
---

## Description
The `TIMEDIFF` function calculates the difference between two datetime values. This function accepts two arguments and returns the difference as a `TIME` type.

## Syntax

```sql
TIMEDIFF(<end_datetime>, <start_datetime>)
```

## Parameters

| Parameter          | Description                  |
|--------------------|------------------------------|
| `<end_datetime>`   | The ending datetime value.   |
| `<start_datetime>` | The starting datetime value. |

## Return Value
Returns a `TIME` type value representing the difference between the two inputs:
- If `<end_datetime>` is later than `<start_datetime>`, it returns a positive time difference.
- If `<end_datetime>` is earlier than `<start_datetime>`, it returns a negative time difference.
- If `<end_datetime>` and `<start_datetime>` are equal, it returns `00:00:00`.
- If `<end_datetime>` or `<start_datetime>` is `NULL`, the function returns `NULL`.
- If `<end_datetime>` or `<start_datetime>` is an invalid datetime value (e.g., `0000-00-00 00:00:00`), the function returns `NULL`.

## Example

```sql
SELECT TIMEDIFF('2024-07-20 16:59:30','2024-07-11 16:35:21');
```

```text
+------------------------------------------------------------------------------------------------------+
| timediff(cast('2024-07-20 16:59:30' as DATETIMEV2(0)), cast('2024-07-11 16:35:21' as DATETIMEV2(0))) |
+------------------------------------------------------------------------------------------------------+
| 216:24:09                                                                                            |
+------------------------------------------------------------------------------------------------------+
```