---
{
    "title": "DAY",
    "language": "en"
}
---

## Description

Obtain the day information from the date, with return values ranging from 1 to 31.

## Alias

- dayofmonth

## Syntax

```sql
DAY(<dt>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| <`dt`> | A valid date expression |

## Return Value

Returns the day information from the given date.

## Examples

```sql
select day('1987-01-31');
```

```text
+----------------------------+
| day('1987-01-31 00:00:00') |
+----------------------------+
|                         31 |
+----------------------------+
```