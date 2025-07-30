---
{
    "title": "NEXT_DAY",
    "language": "en"
}
---

## Description

The NEXT_DAY function is used to return the first date that is later than the given date and matches the specified day of the week.

:::tip
This function is supported since version 3.0.6.
:::

## Syntax

```sql
NEXT_DAY(<datetime/date>, <day_of_week>)
```

## Parameters

| Parameter         | Description                                                   |
|-------------------|---------------------------------------------------------------|
| `<datetime/date>` | The date which will be used to find the next day of the week. |
| `<day_of_week>`   | A STRING expression identifying a day of the week.            |

`<day_of_week>` must be one of the following (case insensitive):
- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## Return Value
A DATE value whatever the input is DATETIME or DATE.

Special cases:
- If the `<datetime/date>` input is NULL, the function returns NULL.
- If the input is NEXT_DAY("9999-12-31 12:00:00", `<day_of_week>`), the function will return same value as the input.

## Example

``` sql
select next_day("2020-01-31 02:02:02", "MONDAY"),next_day("2020-01-31", "MONDAY");
```
```text
+--------------------------------------------+-----------------------------------+
| next_day("2020-01-31 02:02:02", "MONDAY")  | next_day("2020-01-31", "MONDAY")  |
+--------------------------------------------+-----------------------------------+
| 2020-02-03                                 | 2020-02-03                        |
+--------------------------------------------+-----------------------------------+
```
