---
{
    "title": "HUMAN_READABLE_SECONDS",
    "language": "en",
    "description": "Converts a time duration in seconds to a human-readable duration string formatted in days, hours, minutes, and seconds."
}
---

## human_readable_seconds

<version since="dev">

</version>

## Description

The `HUMAN_READABLE_SECONDS` function converts a time duration in seconds into a human-readable duration string formatted with units in order: days (`d`), hours (`h`), minutes (`m`), and seconds (`s`). Intermediate zero-valued units are omitted. Returns `NULL` if the input is negative or `NULL`.

## Syntax

```sql
HUMAN_READABLE_SECONDS(<seconds>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<seconds>` | Required. An integer (`INT` or `BIGINT`) representing seconds. Supported valid range is `0` to `9223372036854775807` (`Long.MAX_VALUE`). Negative values return `NULL`. |

## Return Value

Returns a `VARCHAR` value representing the formatted duration.

- If `<seconds>` is `0`, returns `'0s'`.
- If `<seconds>` is negative (`< 0`) or `NULL`, returns `NULL`.
- Zero-valued units are omitted (e.g. `86401` returns `'1d 1s'`).

## Example

Zero seconds:

```sql
SELECT human_readable_seconds(0);
```

```text
0s
```

Single unit formatting:

```sql
SELECT human_readable_seconds(1);
```

```text
1s
```

```sql
SELECT human_readable_seconds(60);
```

```text
1m
```

```sql
SELECT human_readable_seconds(86400);
```

```text
1d
```

Multi-unit formatting with zero units omitted:

```sql
SELECT human_readable_seconds(3661);
```

```text
1h 1m 1s
```

```sql
SELECT human_readable_seconds(86401);
```

```text
1d 1s
```

```sql
SELECT human_readable_seconds(90061);
```

```text
1d 1h 1m 1s
```

Maximum 64-bit integer value:

```sql
SELECT human_readable_seconds(9223372036854775807);
```

```text
106751991167300d 15h 30m 7s
```

NULL and negative input values return NULL:

```sql
SELECT human_readable_seconds(NULL);
```

```text
NULL
```

```sql
SELECT human_readable_seconds(-100);
```

```text
NULL
```
