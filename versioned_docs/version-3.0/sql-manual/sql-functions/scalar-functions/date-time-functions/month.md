---
{
    "title": "MONTH",
    "language": "en"
}
---

## Description

Extracts the month value from a datetime value. The returned value ranges from 1 to 12, representing the 12 months of the year.

## Syntax

```sql
MONTH(<date>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<date>`  | The input datetime value, which can be of type DATE, DATETIME, or DATETIMEV2 |

## Return Value

Returns an INT type representing the month value:
- Range: 1 to 12
- 1 represents January, and 12 represents December.
- If the input is NULL, the function returns NULL.

## Example

```sql
SELECT MONTH('1987-01-01');
```

```text
+--------------------------------------------+
| month(cast('1987-01-01' as DATETIMEV2(0))) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+
```
