---
{
    "title": "SECOND",
    "language": "en"
}
---

## Description
The function returns the second part of the specified datetime value. The range of seconds is 0 to 59.

## Syntax

```sql
SECOND(<datetime>)
```
## Parameters

| Parameter    | Description                                                        |
|--------------|--------------------------------------------------------------------|
| `<datetime>` | The input date or datetime value. Supports DATE or DATETIME types. |

## Return Value
- Returns an integer representing the second part of the input datetime value, ranging from 0 to 59.
- If the input is NULL, the function returns NULL.
- If the input is an invalid date (e.g., 0000-00-00 00:00:00), the function returns NULL.

## Example
```sql
select second('2018-12-31 23:59:59');
```
```text
+---------------------------------------------+
| second(cast('2018-12-30' as DATETIMEV2(0))) |
+---------------------------------------------+
|                                           0 |
+---------------------------------------------+
```