---
{
    "title": "SEC_TO_TIME",
    "language": "en"
}
---

## Description
The `SEC_TO_TIME` function converts a value in seconds into a `TIME` type, returning the result in the format `HH:MM:SS` or `HH:MM:SS.ssssss`.  
The input seconds represent the time elapsed since the start of a day (`00:00:00.000000`).


## Syntax

```sql
SEC_TO_TIME(<seconds>)
```
## Parameters

| Parameter     | Description                                                                                                                                           |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<seconds>` | Required. The input number of seconds, representing the time elapsed since the start of a day (00:00:00). Supports positive or negative values. |

## Return Value
- Returns a value of `TIME` type.
- If the input is an integer, the return format is `HH:MM:SS`, representing the time calculated from the start of the day (`00:00:00`).
- If the input is a floating-point number, the return format is `HH:MM:SS`, representing the time calculated from the start of the day (`00:00:00`).
- When the absolute value of the input exceeds `3020399`, the return value is `838:59:59` or `838:59:59.000000`, depending on the input type.
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

```sql
SELECT SEC_TO_TIME(59738.1234);
```
```text
+-------------------------+
| SEC_TO_TIME(59738.1234) |
+-------------------------+
| 16:35:38.123400         |
+-------------------------+
```

```sql
SELECT SEC_TO_TIME(-59738.1234);
```
```text
+--------------------------+
| SEC_TO_TIME(-59738.1234) |
+--------------------------+
| -16:35:38.123400         |
+--------------------------+
```

```sql
SELECT SEC_TO_TIME(789456123.0);
```
```text
+--------------------------+
| SEC_TO_TIME(789456123.0) |
+--------------------------+
| 838:59:59.000000         |
+--------------------------+
```

```sql
SELECT SEC_TO_TIME(NULL);
```
```text
+-------------------+
| SEC_TO_TIME(NULL) |
+-------------------+
| NULL              |
+-------------------+
```