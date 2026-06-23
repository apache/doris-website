---
{
    "title": "HUMAN_READABLE_SECONDS",
    "language": "en"
}
---

## Description

Converts a number of seconds into a human-readable duration string (weeks, days, hours, minutes, seconds, and milliseconds).

## Syntax

```sql
HUMAN_READABLE_SECONDS(<x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | The number of seconds to format (numeric input, internally cast to DOUBLE) |

## Return Value

Returns a `VARCHAR` string representing the duration.

## Special Cases

- When `<x>` is `NULL`, returns `NULL`
- Supports negative values, prefixed with `-`
- Fractional seconds are formatted as milliseconds
- When `<x>` is `NaN`, returns `nan`
- When `<x>` is positive infinity, returns `inf`
- When `<x>` is negative infinity, returns `-inf`

## Examples

```sql
select human_readable_seconds(3661);
```

```text
+------------------------------+
| human_readable_seconds(3661) |
+------------------------------+
| 1 hour, 1 minute, 1 second   |
+------------------------------+
```

```sql
select human_readable_seconds(475.33);
```

```text
+--------------------------------+
| human_readable_seconds(475.33) |
+--------------------------------+
| 7 minutes, 55 seconds, 330 milliseconds |
+--------------------------------+
```

```sql
select human_readable_seconds(0.9);
```

```text
+-----------------------------+
| human_readable_seconds(0.9) |
+-----------------------------+
| 900 milliseconds            |
+-----------------------------+
```

```sql
select human_readable_seconds(-0.5);
```

```text
+------------------------------+
| human_readable_seconds(-0.5) |
+------------------------------+
| -500 milliseconds            |
+------------------------------+
```

```sql
select human_readable_seconds(NULL);
```

```text
+------------------------------+
| human_readable_seconds(NULL) |
+------------------------------+
| NULL                         |
+------------------------------+
```