---
{
    "title": "DAYOFWEEK",
    "language": "en"
}
---

## Description

Returns the weekday index of the date, where Sunday is 1, Monday is 2, and Saturday is 7.

## Alias

- DOW

## Syntax

```sql
DAYOFWEEK(<dt>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<dt>` | The date expression to be calculated |

## Return Value

Returns the weekday index of the date.

## Examples

```sql
select dayofweek('2019-06-25');
```

```text
+----------------------------------+
| dayofweek('2019-06-25 00:00:00') |
+----------------------------------+
|                                3 |
+----------------------------------+
```text

```sql
select dayofweek(cast(20190625 as date)); 
```

```text
+-----------------------------------+
| dayofweek(CAST(20190625 AS DATE)) |
+-----------------------------------+
|                                 3 |
+-----------------------------------+
```