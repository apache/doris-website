---
{
  "title": "TO_DATE",
  "language": "en"
}
---

## Description
Date conversion function, used to convert date time (DATETIME) to date type (DATE), that is, remove the time part and keep only the date (YYYY-MM-DD)

## Syntax
```sql
TO_DATE(<datetime_value>)
```

## Required parameter
| Parameter        | Description               |
|-----------------|--------------------------|
| `datetime_value` | DATETIME type date-time |

## Example

Convert `2020-02-02 00:00:00` to `2020-02-02`
```sql
select to_date("2020-02-02 00:00:00");
```
```text
+--------------------------------+
| to_date('2020-02-02 00:00:00') |
+--------------------------------+
| 2020-02-02                     |
+--------------------------------+
```

