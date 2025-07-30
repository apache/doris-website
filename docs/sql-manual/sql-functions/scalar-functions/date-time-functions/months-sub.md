---
{
    "title": "MONTHS_SUB",
    "language": "en"
}
---

## Description
The MONTHS_SUB function is used to add or subtract a specified number of months to a given date and returns the resulting date.

## Syntax

```sql
MONTHS_SUB(<datetime/date>, <nums>)
```

## Parameters

| Parameter         | Description                                                |
|-------------------|------------------------------------------------------------|
| `<datetime/date>` | The date value to which months will be added or subtracted |
| `<nums>`          | The number of months to add or subtract                    |

## Return Value
The return value is of the same type as the input <datetime/date>.
Special cases:
- If the <datetime/date> input is 0000-00-00 or 0000-00-00 00:00:00, the function returns NULL.
- If the <datetime/date> input is NULL, the function returns NULL.
- If the input is MONTHS_SUB("9999-12-31", -1), the function will return NULL.

## Example

``` sql
select months_sub("2020-01-31 02:02:02", 1),months_sub("2020-01-31", 1),months_sub("2020-01-31", -1);
```
```text
+-------------------------------------------------------------+---------------------------------------------+----------------------------------------------+
| months_sub(cast('2020-01-31 02:02:02' as DATETIMEV2(0)), 1) | months_sub(cast('2020-01-31' as DATEV2), 1) | months_sub(cast('2020-01-31' as DATEV2), -1) |
+-------------------------------------------------------------+---------------------------------------------+----------------------------------------------+
| 2019-12-31 02:02:02                                         | 2019-12-31                                  | 2020-02-29                                   |
+-------------------------------------------------------------+---------------------------------------------+----------------------------------------------+
```