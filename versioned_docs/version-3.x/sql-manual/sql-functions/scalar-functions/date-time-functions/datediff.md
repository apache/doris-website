---
{
    "title": "DATEDIFF",
    "language": "en"
}
---

## Description

Calculates the difference between two given dates.

## Syntax

```sql
DATEDIFF(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | The minuend (the date to be subtracted from) |
| `<expr2>` | The subtrahend (the date to subtract) |

## Return Value

Returns the value of `expr1 - expr2`, with the result rounded to the nearest day.

## Examples

```sql
select datediff(CAST('2007-12-31 23:59:59' AS DATETIME), CAST('2007-12-30' AS DATETIME));
```

```text
+-----------------------------------------------------------------------------------+
| datediff(CAST('2007-12-31 23:59:59' AS DATETIME), CAST('2007-12-30' AS DATETIME)) |
+-----------------------------------------------------------------------------------+
|                                                                                 1 |
+-----------------------------------------------------------------------------------+
```

```sql
select datediff(CAST('2010-11-30 23:59:59' AS DATETIME), CAST('2010-12-31' AS DATETIME));
```

```text
+-----------------------------------------------------------------------------------+
| datediff(CAST('2010-11-30 23:59:59' AS DATETIME), CAST('2010-12-31' AS DATETIME)) |
+-----------------------------------------------------------------------------------+
|                                                                               -31 |
+-----------------------------------------------------------------------------------+
```