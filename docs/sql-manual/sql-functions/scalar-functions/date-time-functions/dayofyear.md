---
{
    "title": "DAYOFYEAR",
    "language": "en"
}
---

## Description

Obtains the corresponding day of the year for the given date.

## Alias

- DOY

## Syntax

```sql
DAYOFYEAR(<dt>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<dt>` | The date expression to be calculated |

## Return Value

Returns the day of the year corresponding to the given date.

## Examples

```sql
select dayofyear('2007-02-03 00:00:00');
```

```text
+----------------------------------+
| dayofyear('2007-02-03 00:00:00') |
+----------------------------------+
|                               34 |
+----------------------------------+
```