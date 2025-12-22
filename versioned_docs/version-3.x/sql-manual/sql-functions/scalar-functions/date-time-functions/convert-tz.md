---
{
    "title": "CONVERT_TZ",
    "language": "en",
    "description": "Converts a datetime value from the time zone specified by fromtz to the time zone specified by totz, and returns the resulting value. Special cases:"
}
---

## Description

Converts a datetime value from the time zone specified by from_tz to the time zone specified by to_tz, and returns the resulting value. Special cases:
- If the parameters are invalid, the function returns NULL.

## Syntax

```sql
CONVERT_TZ(<dt>, <from_tz>, <to_tz>)
```

## Parameters

| Parameter | Description |
| -- | -- | 
| `<dt>` | The datetime value to be converted |
| `<from_tz>` | The original time zone of dt |
| `<to_tz>` | The target time zone to convert to |

## Return Value

Returns the calculated date.

## Examples

```sql
select CONVERT_TZ('2019-08-01 13:21:03', 'Asia/Shanghai', 'America/Los_Angeles');
```

```text
+---------------------------------------------------------------------------+
| convert_tz('2019-08-01 13:21:03', 'Asia/Shanghai', 'America/Los_Angeles') |
+---------------------------------------------------------------------------+
| 2019-07-31 22:21:03                                                       |
+---------------------------------------------------------------------------+
```

```sql
select CONVERT_TZ('2019-08-01 13:21:03', '+08:00', 'America/Los_Angeles');
```

```text
+--------------------------------------------------------------------+
| convert_tz('2019-08-01 13:21:03', '+08:00', 'America/Los_Angeles') |
+--------------------------------------------------------------------+
| 2019-07-31 22:21:03                                                |
+--------------------------------------------------------------------+
```
