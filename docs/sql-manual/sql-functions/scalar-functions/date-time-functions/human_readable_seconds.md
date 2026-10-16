---
{
    "title": "HUMAN_READABLE_SECONDS",
    "language": "en",
    "description": "Proposed HUMAN_READABLE_SECONDS contract: rounding, formatting, NULLs, and numeric limits. Currently unavailable in dev and 4.x."
}
---

:::caution Not released

As of 2026-10-16, this function is not implemented on the current dev, 4.0, 4.1, or 4.2 source branches. This page describes the proposed contract of [implementation PR #68524](https://github.com/apache/doris/pull/68524) at commit `be965688c9a07d7b741a60179e543f38f6555d8d`. The first supported version is undetermined; no 4.x backport or first supported 4.x version is confirmed. The SQL and expected outputs below apply only to an environment containing that candidate implementation and must be checked against the final source before merging.

:::

| Documentation scope | Current availability |
| --- | --- |
| dev | Awaiting the implementation PR; current master does not support the function. |
| 4.x | Not supported on current 4.0, 4.1, or 4.2. No backport or first supported version is confirmed. |

## Description

The proposed function rounds the absolute duration in seconds to whole seconds and formats it as an English string containing weeks, days, hours, minutes, and seconds. Returns `NULL` for a `NULL` input, a non-finite value, or a value whose absolute value is at least `2^63` after conversion to `DOUBLE`.

## Syntax

```sql
HUMAN_READABLE_SECONDS(<seconds>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<seconds>` | Required. A duration in seconds of type `DOUBLE`. Other convertible numeric types are converted to `DOUBLE` first. A normal result requires the converted value to be finite and satisfy `-2^63 < seconds < 2^63`; otherwise the result is `NULL`. |

## Return Value

Returns an English duration string of type `VARCHAR`. Returns SQL `NULL` for a `NULL` input, `NaN`, positive or negative infinity, or a converted value with absolute value at least `2^63`.

<a id="special-cases"></a>

- Take the absolute value first, then round to the nearest whole second; an exact half second rounds toward the larger absolute second count. Negative inputs produce no minus sign: `-0.5` returns `1 second`.
- The result contains no milliseconds or fractional seconds. For example, `475.33` returns `7 minutes, 55 seconds`, and `0.9` returns `1 second`.
- Units appear in the order `weeks`, `days`, `hours`, `minutes`, `seconds`, separated by a comma and a space. Zero-valued units are omitted, and a unit with value 1 uses its singular form.
- A rounded value of zero returns `0 seconds`. A week is exactly 7 days and a day is exactly 24 hours; this is duration formatting, with no time-zone or calendar conversion.
- Range checks apply after conversion to `DOUBLE`. Large integers or precise decimals may lose precision; for example, `9223372036854775807` converts to the `DOUBLE` value `2^63` and therefore returns `NULL`, rather than clamping to the maximum integer.

## Example {#examples}

These are the expected results of the pinned candidate commit, not queries supported by current dev or 4.x releases.

### Format a duration and omit zero units

```sql
SELECT human_readable_seconds(3661) AS duration,
       human_readable_seconds(3601) AS skipped_zero_units;
```

```text
+----------------------------+--------------------+
| duration                   | skipped_zero_units |
+----------------------------+--------------------+
| 1 hour, 1 minute, 1 second | 1 hour, 1 second   |
+----------------------------+--------------------+
```

### Weeks and plural units

```sql
SELECT human_readable_seconds(604800) AS one_week,
       human_readable_seconds(1209600) AS two_weeks;
```

```text
+----------+-----------+
| one_week | two_weeks |
+----------+-----------+
| 1 week   | 2 weeks   |
+----------+-----------+
```

### Large durations

```sql
SELECT human_readable_seconds(56363463) AS duration;
```

```text
+-------------------------------------------------+
| duration                                        |
+-------------------------------------------------+
| 93 weeks, 1 day, 8 hours, 31 minutes, 3 seconds |
+-------------------------------------------------+
```

### Fractional and negative inputs

```sql
SELECT human_readable_seconds(475.33) AS fractional,
       human_readable_seconds(0.9) AS subsecond,
       human_readable_seconds(-0.5) AS negative;
```

```text
+-----------------------+-----------+----------+
| fractional            | subsecond | negative |
+-----------------------+-----------+----------+
| 7 minutes, 55 seconds | 1 second  | 1 second |
+-----------------------+-----------+----------+
```

### Zero and rounding at one-half second

```sql
SELECT human_readable_seconds(0) AS zero_value,
       human_readable_seconds(0.49) AS below_half,
       human_readable_seconds(0.5) AS half_second;
```

```text
+------------+------------+-------------+
| zero_value | below_half | half_second |
+------------+------------+-------------+
| 0 seconds  | 0 seconds  | 1 second    |
+------------+------------+-------------+
```

### Rounding carries into the next unit

```sql
SELECT human_readable_seconds(59.5) AS minute_boundary,
       human_readable_seconds(604799.5) AS week_boundary;
```

```text
+-----------------+---------------+
| minute_boundary | week_boundary |
+-----------------+---------------+
| 1 minute        | 1 week        |
+-----------------+---------------+
```

### Fractional seconds across several units

```sql
SELECT human_readable_seconds(535333.9513888889) AS duration;
```

```text
+-----------------------------------------+
| duration                                |
+-----------------------------------------+
| 6 days, 4 hours, 42 minutes, 14 seconds |
+-----------------------------------------+
```

### NULL input

```sql
SELECT human_readable_seconds(NULL) AS duration;
```

```text
+----------+
| duration |
+----------+
| NULL     |
+----------+
```

### Non-finite values

```sql
SELECT human_readable_seconds(CAST('nan' AS DOUBLE)) AS nan_value,
       human_readable_seconds(CAST('inf' AS DOUBLE)) AS positive_infinity,
       human_readable_seconds(CAST('-inf' AS DOUBLE)) AS negative_infinity;
```

```text
+-----------+-------------------+-------------------+
| nan_value | positive_infinity | negative_infinity |
+-----------+-------------------+-------------------+
| NULL      | NULL              | NULL              |
+-----------+-------------------+-------------------+
```

### The upper supported DOUBLE boundary

```sql
SELECT human_readable_seconds(CAST('9223372036854774784' AS DOUBLE)) AS duration;
```

```text
+---------------------------------------------------------------+
| duration                                                      |
+---------------------------------------------------------------+
| 15250284452471 weeks, 3 days, 15 hours, 13 minutes, 4 seconds |
+---------------------------------------------------------------+
```

### Overflow and conversion of BIGINT_MAX

```sql
SELECT human_readable_seconds(1e19) AS too_large,
       human_readable_seconds(9223372036854775807) AS bigint_max,
       human_readable_seconds(-9223372036854775808) AS bigint_min;
```

```text
+-----------+------------+------------+
| too_large | bigint_max | bigint_min |
+-----------+------------+------------+
| NULL      | NULL       | NULL       |
+-----------+------------+------------+
```
