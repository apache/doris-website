---
{
    "title": "HUMAN_READABLE_SECONDS",
    "language": "en",
    "description": "Formats a duration in seconds into a human-readable string containing weeks, days, hours, minutes, and seconds."
}
---

## human_readable_seconds

<version since="dev">

</version>

## Description

The `HUMAN_READABLE_SECONDS` function converts a numeric value representing seconds into a human-readable duration string containing `weeks`, `days`, `hours`, `minutes`, and `seconds`. For all finite inputs below 2^63, the formatted output matches Trino's `human_readable_seconds`.

- Non-zero duration units are formatted in descending order (`weeks`, `days`, `hours`, `minutes`, `seconds`), separated by commas.
- Empty (zero-valued) units are omitted (e.g., `3601` returns `'1 hour, 1 second'`).
- Singular and plural unit forms are handled automatically (e.g., `'1 week'` vs `'2 weeks'`, `'1 day'` vs `'2 days'`).
- Input `0` returns `'0 seconds'`.
- Negative values are evaluated using their absolute value (e.g., `-60` returns `'1 minute'`).
- Fractional values are rounded to the nearest integer second.
- `NULL`, `NaN`, and `±Infinity` return `NULL` (unlike Trino, which raises an `INVALID_FUNCTION_ARGUMENT` error).
- Values exceeding the 64-bit signed integer range ($|x| \ge 2^{63}$, such as `1e19` or `9223372036854775807`) return `NULL` (unlike Trino, which clamps to `Long.MAX_VALUE`).

## Syntax

```sql
HUMAN_READABLE_SECONDS(<seconds>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<seconds>` | Required. A numeric value (`DOUBLE`) representing duration in seconds. Other numeric types (`BIGINT`, `INT`, `FLOAT`, etc.) are automatically coerced to `DOUBLE`. |

## Return Value

Returns a `VARCHAR` string representing the formatted duration. Returns `NULL` if input is `NULL`, `NaN`, `±Infinity`, or if absolute value is greater than or equal to 2^63.

## Example

```sql
SELECT human_readable_seconds(0);
```

```text
0 seconds
```

```sql
SELECT human_readable_seconds(96);
```

```text
1 minute, 36 seconds
```

```sql
SELECT human_readable_seconds(3762);
```

```text
1 hour, 2 minutes, 42 seconds
```

```sql
SELECT human_readable_seconds(604800);
```

```text
1 week
```

```sql
SELECT human_readable_seconds(56363463);
```

```text
93 weeks, 1 day, 8 hours, 31 minutes, 3 seconds
```

Fractional seconds rounded to nearest second:

```sql
SELECT human_readable_seconds(535333.9513888889);
```

```text
6 days, 4 hours, 42 minutes, 14 seconds
```

Negative inputs:

```sql
SELECT human_readable_seconds(-60);
```

```text
1 minute
```

Boundary and special values returning NULL:

```sql
SELECT human_readable_seconds(1e19);
```

```text
NULL
```

```sql
SELECT human_readable_seconds(cast('nan' as double));
```

```text
NULL
```
