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

The `HUMAN_READABLE_SECONDS` function converts a numeric value representing seconds into a human-readable duration string containing `weeks`, `days`, `hours`, `minutes`, and `seconds`. This function is compatible with Trino's `human_readable_seconds`.

- Non-zero duration units are formatted in descending order (`weeks`, `days`, `hours`, `minutes`, `seconds`), separated by commas.
- Empty (zero-valued) units are omitted (e.g., `3601` returns `'1 hour, 1 second'`).
- Singular and plural unit forms are handled automatically (e.g., `'1 day'` vs `'2 days'`).
- Input `0` returns `'0 seconds'`.
- Negative values are evaluated using their absolute value (e.g., `-60` returns `'1 minute'`).
- Fractional values are rounded to the nearest integer second.
- `NULL`, `NaN`, and `Infinity` return `NULL`.

## Syntax

```sql
HUMAN_READABLE_SECONDS(<seconds>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<seconds>` | Required. A numeric value (`DOUBLE`, `FLOAT`, `BIGINT`, or `INT`) representing duration in seconds. |

## Return Value

Returns a `VARCHAR` string representing the formatted duration. Returns `NULL` if input is `NULL`, `NaN`, or `Infinity`.

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
