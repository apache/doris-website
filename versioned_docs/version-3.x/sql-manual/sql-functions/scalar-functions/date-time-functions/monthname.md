---
{
    "title": "MONTHNAME",
    "language": "en"
}
---

## Description

Returns the English name of the month corresponding to a given date. The returned value is the full English name of the month (from January to December).

## Syntax

```sql
MONTHNAME(<date>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<date>`  | The input datetime value, which can be of type DATE, DATETIME, or DATETIMEV2 |

## Return Value

Returns a value of type VARCHAR representing the English name of the month:
- Possible return values: January, February, March, April, May, June, July, August, September, October, November, December
- If the input is NULL, the function returns NULL.
- The first letter of the return value is capitalized, and the remaining letters are in lowercase.

## Example

```sql
SELECT MONTHNAME('2008-02-03 00:00:00');
```

```text
+---------------------------------------------------------+
| monthname(cast('2008-02-03 00:00:00' as DATETIMEV2(0))) |
+---------------------------------------------------------+
| February                                                |
+---------------------------------------------------------+
```
