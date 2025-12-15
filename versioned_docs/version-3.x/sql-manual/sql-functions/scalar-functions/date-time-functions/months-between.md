---
{
    "title": "MONTHS_BETWEEN",
    "language": "en"
}
---

## Description

The `MONTHS_BETWEEN` function calculates the floating-point number of months between two dates. It receives two date arguments and a optional boolean argument.

:::tip
This function is supported since version 3.0.6.
:::

**Note:**
When both `<enddate>` and `<startdate>` are the last day of their respective months, the function applies special handling.It returns the full month difference without considering the fractional part based on days. This ensures consistency when comparing the end of one month to the end of another.

For example:
- `months_between('2024-01-31', '2024-02-29')` will return `-1.0`, because both dates are the last day of their respective months (January 31st and February 29th), so the result is treated as a full month difference without fractional adjustments.
- `months_between('2024-01-29', '2024-02-29')` will also return `-1.0`, because the day of the month is the same.
- `months_between('2024-01-30', '2024-02-29')` will return `-0.96774194`, because the day of the month is not the same and not the last day of the month.

## Syntax

```sql
MONTHS_BETWEEN(<enddate>, <startdate> [, <round_type>])
```

## Parameters

| Parameter         | Description                                                |
|-------------------|------------------------------------------------------------|
| `<enddate>`   | The ending date, representing the later date in the difference calculation. Supports `DATE` (e.g., `YYYY-MM-DD`) or `DATETIME` (e.g., `YYYY-MM-DD HH:MM:SS`) types.     |
| `<startdate>` | The starting date, representing the earlier date in the difference calculation. Supports `DATE` (e.g., `YYYY-MM-DD`) or `DATETIME` (e.g., `YYYY-MM-DD HH:MM:SS`) types. |
| `<round_type>` | Whether to round the result to the eighth decimal place. Supports `true` or `false`. Default is `true`. |

## Return Value

returns the floating-point number of months resulting from `<enddate>` minus `<startdate>`

result = (`<enddate>.year` - `<startdate>.year`) * 12 + `<enddate>.month` - `<startdate>.month` + (`<enddate>.day` - `<startdate>.day`) / 31.0

- When either `<enddate>` or `<startdate>` is NULL, or both are NULL, it returns NULL
- When `<round_type>` is `true`, the result is rounded to the eighth decimal place.

## Example

```sql
select months_between('2020-12-26','2020-10-25'),months_between('2020-10-25 10:00:00','2020-12-26 11:00:00',false);
```

```text
+-------------------------------------------+-------------------------------------------------------------------+
| months_between('2020-12-26','2020-10-25') | months_between('2020-10-25 10:00:00','2020-12-26 11:00:00',false) |
+-------------------------------------------+-------------------------------------------------------------------+
|                                2.03225806 |                                                -2.032258064516129 |
+-------------------------------------------+-------------------------------------------------------------------+
```
