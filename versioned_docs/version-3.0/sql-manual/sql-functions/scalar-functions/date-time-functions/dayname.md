---
{
    "title": "DAYNAME",
    "language": "en"
}
---

## Description

Calculates the name of the day corresponding to the given date expression.

## Syntax

```sql
DAYNAME(<dt>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<dt>` | The date expression to be calculated |

## Return Value

Returns the name of the day corresponding to the given date expression.

## Examples

```sql
select dayname('2007-02-03 00:00:00');
```

```text
+--------------------------------+
| dayname('2007-02-03 00:00:00') |
+--------------------------------+
| Saturday                       |
+--------------------------------+
```