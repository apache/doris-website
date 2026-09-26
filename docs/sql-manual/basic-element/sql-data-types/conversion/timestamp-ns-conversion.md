---
{
    "title": "Cast to TIMESTAMP_NS Type",
    "language": "en",
    "description": "Rules for converting character, numeric, and temporal values to the fixed nanosecond-precision TIMESTAMP_NS type."
}
---

## Description

`TIMESTAMP_NS` has fixed nanosecond precision and the exact range `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`. It does not accept a precision parameter.

String and numeric values generally use the same field mapping as [`DATETIME`](./datetime-conversion.md). In both strict and non-strict cast modes, `TIMESTAMP_NS` supports exactly the same string formats as `DATETIME` in the corresponding mode. The only difference in string format capability is that `TIMESTAMP_NS` supports up to nine fractional-second digits of precision, whereas `DATETIME` supports up to six.

## Syntax

```sql
CAST(<source_expr> AS TIMESTAMP_NS)
TRY_CAST(<source_expr> AS TIMESTAMP_NS)
```

## Supported Source Types

| Source type | Conversion behavior |
| --- | --- |
| `CHAR`, `VARCHAR`, `STRING` | Parses a date-time string using the corresponding strict or non-strict `DATETIME` string grammar, with up to nine fractional-second digits of precision. |
| Integer types | Interprets the value as a compact date or date-time. |
| `FLOAT` | Uses the value actually represented by the single-precision input; loss of significant digits can make a large compact date-time invalid. |
| `DOUBLE` | Uses the value actually represented by the double-precision input; the fractional part represents fractional seconds. |
| `DECIMAL` types | Interprets the integer part as a compact date or date-time and the decimal part as fractional seconds. |
| `DATE` | Adds `00:00:00.000000000`. |
| `DATETIME(p)` | Preserves the civil date and time and pads the fraction with zeros to nine digits. |
| `TIME(p)` | Adds the input duration to midnight of the current date. |
| `TIMESTAMPTZ(p)` | Converts the instant to the current session time zone and then removes the time zone. |
| `TIMESTAMP_NS` | Returns the value unchanged. |
| `VARIANT` | Extracts a compatible scalar value and applies the corresponding string, numeric, or temporal conversion rule. |
| `NULL` | Returns `NULL`. |

Conversions from unsupported types, including `BOOLEAN`, `JSON`, IP, binary, and complex types, fail during analysis. This is a type error rather than a value-conversion error, so neither non-strict `CAST` nor `TRY_CAST` changes it to `NULL`.

## From String

### Strict Mode

When `enable_strict_cast = true`, the supported formats and parsing rules are exactly the same as those in the [strict-mode `DATETIME` string conversion](./datetime-conversion.md#from-string). This includes the rules for date and time fields, two-digit years, omitted time fields, consecutive digits, whitespace, and time zone suffixes.

### Non-strict Mode

When `enable_strict_cast = false`, the supported formats and parsing rules are exactly the same as those in the [non-strict-mode `DATETIME` string conversion](./datetime-conversion.md#from-string). All strict-mode formats remain valid, and the additional separators, delimiters, and leading or trailing whitespace accepted by non-strict `DATETIME` are also accepted by `TIMESTAMP_NS`.

The difference between the two modes when casting to `TIMESTAMP_NS` is the same as for `DATETIME`: a format or domain error raises an error in strict mode and returns `NULL` in non-strict mode.

### Fractional Seconds

The only difference from the corresponding `DATETIME` string formats is the supported fractional-second precision:

- The target scale is always 9. A fraction with fewer than nine digits is padded on the right with zeros.
- A fraction with more than nine digits is rounded half up. The tenth digit determines whether the ninth digit is incremented; later digits do not affect the result.
- A rounding carry propagates normally to the second, date, or year.
- Doris validates the `TIMESTAMP_NS` range after fractional rounding and time zone conversion.

### Time Zone Handling

`TIMESTAMP_NS` does not store a time zone:

- Without a time zone suffix, the parsed civil date and time is stored unchanged.
- With a numeric offset, UTC designator, or IANA time zone name, Doris converts the input instant to the current session time zone and stores the resulting civil date and time without a time zone.
- Changing the session time zone after the value has been stored does not change the stored value.

For the accepted time zone suffixes and names, see the [`DATETIME` string conversion rules](./datetime-conversion.md#from-string) and [Time Zone](../../../../admin-manual/cluster-management/time-zone).

Assume `time_zone = '+08:00'` for the following examples:

| String | Mode | Result | Explanation |
| --- | --- | --- | --- |
| `2024-02-29 12:34:56.123456` | Both | `2024-02-29 12:34:56.123456000` | Pads the fraction to nine digits. |
| `2024-02-29 12:34:56.1234567894` | Both | `2024-02-29 12:34:56.123456789` | The tenth digit is less than 5, so the value rounds down. |
| `2024-02-29 12:34:56.1234567895` | Both | `2024-02-29 12:34:56.123456790` | The tenth digit is 5, so the value rounds up. |
| `2024-02-29 12:34:56.9999999995` | Both | `2024-02-29 12:34:57.000000000` | The rounding carry reaches the next second. |
| `2024-02-29T04:34:56.123456789Z` | Both | `2024-02-29 12:34:56.123456789` | Converts UTC to the session time zone and removes the time zone. |
| `  2023-7-4T9-5-3.1Z  ` | Non-strict only | `2023-07-04 17:05:03.100000000` | Uses non-strict separators and leading or trailing whitespace. |
| `2024-02-30 12:34:56` | Both | Invalid | February 30 is not a Gregorian calendar date. |
| `2024-01-01 00:00:00.123.456` | Both | Invalid | The fractional-second syntax is invalid. |

### Boundary Rounding

Rounding occurs before the final range check. Therefore, an input immediately outside a boundary can become valid after rounding, while an input at the upper boundary can become invalid after rounding up.

| String | Result |
| --- | --- |
| `1677-09-21 00:12:43.1452241914` | Invalid: below the lower limit after rounding |
| `1677-09-21 00:12:43.1452241915` | `1677-09-21 00:12:43.145224192` |
| `2262-04-11 23:47:16.8547758074` | `2262-04-11 23:47:16.854775807` |
| `2262-04-11 23:47:16.8547758075` | Invalid: above the upper limit after rounding |

## From Numeric

All integer, floating-point, and decimal types can be converted to `TIMESTAMP_NS`. `BOOLEAN` is not supported.

The integer-part field mapping, two-digit year rule, and valid compact representations are the same as [numeric-to-`DATETIME` conversion](./datetime-conversion.md#from-numeric). In particular, valid representations contain 3, 4, 5, 6, 8, or 14 integer digits. The decimal part represents fractional seconds.

The compact date-time and the fractional part must produce a value within the `TIMESTAMP_NS` range. Fractional seconds are padded or rounded to exactly nine digits using the same half-up rule as string input.

### From Integer Types

Integer types have no fractional part. Doris applies the compact numeric field mapping and appends `.000000000` to the result.

| Integer value | Result | Explanation |
| --- | --- | --- |
| `123` | `2000-01-23 00:00:00.000000000` | Three-digit compact date. |
| `20240229` | `2024-02-29 00:00:00.000000000` | Eight-digit compact date. |
| `20240229123456` | `2024-02-29 12:34:56.000000000` | Fourteen-digit compact date-time. |
| `16770921001243` | Invalid | The resulting time is below the lower limit. |
| `22620412000000` | Invalid | The resulting time is above the upper limit. |

### From FLOAT

`FLOAT` uses the decimal value represented by the single-precision input before the cast. Its limited number of significant digits is generally insufficient for a 14-digit compact date-time, so a large input can lose digits and become an invalid date-time. Use `DOUBLE` or `DECIMAL` for large compact values.

| FLOAT input expression | Strict-mode result | Non-strict-mode result | Explanation |
| --- | --- | --- | --- |
| `CAST(123 AS FLOAT)` | `2000-01-23 00:00:00.000000000` | `2000-01-23 00:00:00.000000000` | The represented value is exact. |
| `CAST(20240229123456.125 AS FLOAT)` | Error | `NULL` | Significant-digit loss makes the represented compact date-time invalid. |

### From DOUBLE

`DOUBLE` uses the decimal value represented by the double-precision input before the cast. It can exactly represent the 14-digit integer part of every compact `TIMESTAMP_NS` value, but a decimal fraction that is not exactly representable in binary can still be rounded before conversion. Use `DECIMAL` when every input fractional digit must be preserved.

| DOUBLE input expression | Result | Explanation |
| --- | --- | --- |
| `CAST(20240229123456.125 AS DOUBLE)` | `2024-02-29 12:34:56.125000000` | The integer and fractional parts are exactly representable. |

### From DECIMAL

`DECIMAL` preserves its literal decimal representation. Digits beyond nanosecond precision are rounded half-up to nine fractional digits.

| DECIMAL input expression | Result | Explanation |
| --- | --- | --- |
| `CAST(20240229123456.1234567895 AS DECIMAL(24, 10))` | `2024-02-29 12:34:56.123456790` | The fraction is rounded to nanoseconds. |

### Error Handling

Strict and non-strict modes use the same numeric mapping. If the represented numeric value cannot produce a valid in-range `TIMESTAMP_NS`, strict mode reports an error and non-strict mode returns `NULL`. A `NULL` input returns `NULL` in both modes.

## From Datelike Types

### From DATE

Doris appends `00:00:00.000000000` to the input date and then checks the `TIMESTAMP_NS` range. Because midnight on the lower boundary date is outside the range, `1677-09-21` cannot be converted; the earliest convertible `DATE` is `1677-09-22`. The latest convertible `DATE` is `2262-04-11`.

| Input `DATE` | Result |
| --- | --- |
| `1677-09-21` | Invalid |
| `1677-09-22` | `1677-09-22 00:00:00.000000000` |
| `2262-04-11` | `2262-04-11 00:00:00.000000000` |
| `2262-04-12` | Invalid |

### From DATETIME

`DATETIME` and `TIMESTAMP_NS` are both time-zone-naive, so Doris preserves the civil date and time without a time zone adjustment. A `DATETIME(p)` fraction is padded on the right with zeros to nine digits; no precision is invented beyond the source value.

The padded result must be within the `TIMESTAMP_NS` range. Because `DATETIME` supports at most microsecond precision, the earliest convertible value on the lower boundary is `1677-09-21 00:12:43.145225`, and the latest convertible value on the upper boundary is `2262-04-11 23:47:16.854775`.

| Input `DATETIME(6)` | Result |
| --- | --- |
| `1677-09-21 00:12:43.145224` | Invalid |
| `1677-09-21 00:12:43.145225` | `1677-09-21 00:12:43.145225000` |
| `2024-02-29 12:34:56.123456` | `2024-02-29 12:34:56.123456000` |
| `2262-04-11 23:47:16.854775` | `2262-04-11 23:47:16.854775000` |
| `2262-04-11 23:47:16.854776` | Invalid |

### From TIME

Doris starts with midnight of the current date in the session time zone and adds the signed `TIME` duration. The duration can cross a date boundary. The fractional part has at most microsecond precision and is padded with zeros to nine digits. Doris then checks that the final date and time is within the `TIMESTAMP_NS` range.

For example, if the current date is `2025-04-29`:

| Input `TIME(6)` | Result |
| --- | --- |
| `12:34:56.123456` | `2025-04-29 12:34:56.123456000` |
| `500:00:00.000000` | `2025-05-19 20:00:00.000000000` |
| `-128:00:00.000000` | `2025-04-23 16:00:00.000000000` |

Because this conversion depends on the current date, use an explicit `DATE` or `DATETIME` instead when a reproducible calendar date is required.

### From TIMESTAMPTZ

Doris converts the represented instant to the current session time zone, removes the time zone, and pads the source fraction with zeros to nine digits. The final local date and time must be within the `TIMESTAMP_NS` range.

Changing `time_zone` can therefore change the result of the cast and can move a boundary value into or out of the supported range.

```sql
SET time_zone = '+08:00';
SELECT CAST(CAST('2024-02-29 04:34:56.123456+00:00' AS TIMESTAMPTZ(6)) AS TIMESTAMP_NS) AS ts;
```

```text
+-------------------------------+
| ts                            |
+-------------------------------+
| 2024-02-29 12:34:56.123456000 |
+-------------------------------+
```

### From TIMESTAMP_NS and VARIANT

Casting a `TIMESTAMP_NS` value to the same type preserves it exactly. A compatible string, numeric, date, or timestamp value stored in `VARIANT` follows the corresponding rule above. Zoned timestamp values are converted to the current session time zone; time-zone-naive timestamp values preserve their civil fields. Incompatible `VARIANT` contents return `NULL` or report an error according to the cast mode.

## Related Conversions

Converting `TIMESTAMP_NS` to [`DATETIME(p)`](./datetime-conversion.md) or [`TIMESTAMPTZ(p)`](./timestamptz-conversion.md) rounds the fraction to the target precision. For example, converting `2024-02-29 12:34:56.123456789` to precision 6 produces `2024-02-29 12:34:56.123457`.

When `TIMESTAMP_NS` and `DATETIME` values are combined in comparisons, joins, `CASE`, `COALESCE`, or set operations, Doris uses `TIMESTAMP_NS` as the common type when it can preserve the values exactly.

## Error Handling

| Situation | `enable_strict_cast = true` | `enable_strict_cast = false` | `TRY_CAST` |
| --- | --- | --- | --- |
| Invalid format or calendar value | Error | `NULL` | `NULL` |
| Value outside the `TIMESTAMP_NS` range | Error | `NULL` | `NULL` |
| Source value is `NULL` | `NULL` | `NULL` | `NULL` |
| Unsupported source-target type pair | Analysis error | Analysis error | Analysis error |

For string input, `enable_strict_cast` selects the corresponding strict or non-strict `DATETIME` parsing rules and controls the handling of conversion failures. For numeric input, it changes only error handling; the numeric mapping is the same in both modes.

## Examples

Convert strings at nanosecond precision and observe rounding:

```sql
SELECT
    CAST('2024-02-29 12:34:56.123456' AS TIMESTAMP_NS) AS padded,
    CAST('2024-02-29 12:34:56.1234567895' AS TIMESTAMP_NS) AS rounded;
```

```text
+-------------------------------+-------------------------------+
| padded                        | rounded                       |
+-------------------------------+-------------------------------+
| 2024-02-29 12:34:56.123456000 | 2024-02-29 12:34:56.123456790 |
+-------------------------------+-------------------------------+
```

Convert a numeric date-time representation:

```sql
SELECT CAST(CAST(20240229123456.1234567895 AS DECIMAL(24, 10)) AS TIMESTAMP_NS) AS ts;
```

```text
+-------------------------------+
| ts                            |
+-------------------------------+
| 2024-02-29 12:34:56.123456790 |
+-------------------------------+
```

In non-strict mode, invalid and out-of-range values return `NULL`:

```sql
SET enable_strict_cast = false;
SELECT
    CAST('2024-02-30 00:00:00' AS TIMESTAMP_NS) AS invalid_date,
    CAST('2262-04-11 23:47:16.8547758075' AS TIMESTAMP_NS) AS overflow;
```

```text
+--------------+----------+
| invalid_date | overflow |
+--------------+----------+
| NULL         | NULL     |
+--------------+----------+
```
