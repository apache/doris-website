---
{
    "title": "MAKEDATE",
    "language": "en"
}
---

## Description

Returns a date based on the specified year and the day of the year (dayofyear).

Special cases:
- Returns NULL when `dayofyear` is less than or equal to 0.
- Automatically rolls over to the next year if `dayofyear` exceeds the number of days in the year.

## Syntax

```sql
MAKEDATE(<year>, <day_of_year>)
```

## Parameters

| Parameter   | Description                               |
|-------------|-------------------------------------------|
| `<year>`    | The specified year, of type INT          |
| `<day_of_year>` | The day of the year (1-366), of type INT |

## Return Value

Returns a value of type DATE, constructed from the specified year and the given day of the year.

## Example

```sql
SELECT MAKEDATE(2021, 1), MAKEDATE(2021, 100), MAKEDATE(2021, 400);
```

```text
+-------------------+---------------------+---------------------+
| makedate(2021, 1) | makedate(2021, 100) | makedate(2021, 400) |
+-------------------+---------------------+---------------------+
| 2021-01-01        | 2021-04-10          | 2022-02-04          |
+-------------------+---------------------+---------------------+
```
