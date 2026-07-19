---
{
    "title": "VARIANT V2 Behavior and Semantics",
    "language": "en-US",
    "description": "User-facing reference for experimental VARIANT V2 behavior, including equality, CAST, JSON parsing, Decimal and date/time semantics, examples, and limits."
}
---

## Overview

Experimental VARIANT V2 extends the operations that can consume `VARIANT` values and defines consistent logical-value semantics for grouping, deduplication, and set operations.

Use the [VARIANT type reference](./VARIANT) for SQL syntax, indexes, storage configuration, and general type rules. Use the [VARIANT Workload Guide](./variant-workload-guide) when choosing between default storage behavior, sparse columns, DOC mode, and Schema Template. This page describes only the behavior users can observe after enabling V2.

:::caution Experimental feature
V2 is disabled by default and applies only to the current session. Existing data and the persisted Variant format remain unchanged. Enable it only after validating the target workload.
:::

## Enable V2

Set the session variable before running the target statements:

```sql
SET enable_variant_v2 = true;
```

The setting affects only the current session. Existing persisted `VARIANT` data remains unchanged.

## Behavior after enabling V2

| Area | V2 behavior |
| --- | --- |
| Grouping and deduplication | Supported Variant values can be used by `GROUP BY`, `DISTINCT`, and `COUNT(DISTINCT ...)` with logical-value equality. |
| Set operations | Supported Variant values can participate in `INTERSECT`, `EXCEPT`, and `UNION DISTINCT`. |
| JSON parsing | JSON text is parsed explicitly with `parse_to_variant` or `parse_to_variant_error_to_null`. |
| String conversion | `CAST(string AS VARIANT)` creates a Variant string and does not parse the string as JSON. |
| Nested expressions | Supported conditional expressions, nested containers, and Variant-aware `explode` can consume Variant values. |
| Invalid values | Malformed or unsupported Variant values return an error instead of being silently accepted. |

V2 does not enable every operation on a whole (root) Variant value. In particular, direct comparison predicates, join keys, sorting, and `MIN`/`MAX` remain restricted as described in [Current limitations](#current-limitations).

For example, grouping or deduplicating a root Variant value is not supported on the default path. After V2 is enabled, the same values can be grouped by logical equality:

```sql
SET enable_variant_v2 = true;

SELECT COUNT(DISTINCT value) AS distinct_count
FROM (
    SELECT PARSE_TO_VARIANT('1') AS value
    UNION ALL
    SELECT PARSE_TO_VARIANT('1.0') AS value
) AS numeric_values;
-- distinct_count: 1
```

## Equality semantics

Grouping, deduplication, and set operations compare the logical value rather than its source SQL type or representation:

- Equivalent integral numeric representations are equal.
- Decimal trailing zeros do not change the value, so `1.20` and `1.2` are equal.
- `+0`, `-0`, and integral zero are equal.
- Object key order does not affect equality.
- Array element order affects equality.
- Variant/JSON `null` is distinct from SQL `NULL`.

```sql
-- Object key order is ignored.
SELECT COUNT(DISTINCT value) AS distinct_count
FROM (
    SELECT PARSE_TO_VARIANT('{\"a\": 1, \"b\": 2}') AS value
    UNION ALL
    SELECT PARSE_TO_VARIANT('{\"b\": 2, \"a\": 1}') AS value
) AS object_values;
-- distinct_count: 1

-- Array order is preserved.
SELECT COUNT(DISTINCT value) AS distinct_count
FROM (
    SELECT PARSE_TO_VARIANT('[1, 2]') AS value
    UNION ALL
    SELECT PARSE_TO_VARIANT('[2, 1]') AS value
) AS array_values;
-- distinct_count: 2
```

These equality rules apply to supported hash-based and set operations. They do not enable direct `VARIANT = VARIANT`, null-safe equality, or ordering comparisons.

## CAST and JSON parsing

V2 distinguishes a Variant string from a parsed JSON value:

| Operation | Result | Invalid JSON behavior |
| --- | --- | --- |
| `CAST(string AS VARIANT)` | A Variant string containing the original text | No JSON validation is performed |
| `parse_to_variant(string)` | A Variant value parsed from JSON text | Returns an error |
| `parse_to_variant_error_to_null(string)` | A Variant value parsed from JSON text | Returns SQL `NULL` |
| `CAST(variant_value AS T)` | A concrete SQL value of type `T` | Follows the target type's cast rules |

See [PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant) and [PARSE_TO_VARIANT_ERROR_TO_NULL](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant-error-to-null) for full function syntax.

```sql
SET enable_variant_v2 = true;

SELECT PARSE_TO_VARIANT('{\"id\": 1}') AS parsed_object,
       CAST('{\"id\": 1}' AS VARIANT) AS variant_string;

SELECT ELEMENT_AT(CAST('{\"id\": 1}' AS VARIANT), 'id') AS from_string,
       ELEMENT_AT(PARSE_TO_VARIANT('{\"id\": 1}'), 'id') AS from_json;
-- from_string: NULL; from_json: 1

SELECT PARSE_TO_VARIANT_ERROR_TO_NULL('{\"id\":') AS invalid_value;
-- invalid_value: NULL

SELECT CAST(PARSE_TO_VARIANT('42') AS BIGINT) AS id;
-- id: 42
```

Do not use `CAST(string AS VARIANT)` to validate JSON. Extracted Variant values should be cast to a concrete SQL type before typed comparison, filtering, ordering, or arithmetic.

## Decimal semantics and limits

V2 preserves supported Decimal values exactly, including their scale. Equality semantics then ignore insignificant trailing zeros.

| Doris input type | Supported range | V2 behavior |
| --- | --- | --- |
| Legacy `DECIMALV2` | Precision up to 27; scale up to 9 | Preserved as an exact Variant Decimal |
| `DECIMAL(p, s)` | `1 <= p <= 38`, `0 <= s <= p` | Preserved as an exact Variant Decimal |
| `DECIMAL(p, s)` | `39 <= p <= 76` | Not supported by V2; cast to precision 38 or lower first |

Current Decimal limits:

- Variant Decimal supports precision and scale up to 38.
- The source value must fit both its Doris Decimal type and the Variant precision limit.
- Values such as `1.20` and `1.2` retain their Decimal value and compare as one logical value in supported grouping and set operations.

## Date and time semantics and limits

| Doris input type | Variant semantics | Precision and time-zone behavior |
| --- | --- | --- |
| `DATE` | Calendar date | Day precision; no time or time zone |
| Legacy `DATETIME` | Timestamp without time zone | Whole-second precision; no session time-zone adjustment |
| `DATETIME(p)` | Timestamp without time zone | `0 <= p <= 6`; no session time-zone adjustment |
| `TIMESTAMPTZ(p)` | Time-zone-adjusted timestamp | `0 <= p <= 6` |
| `TIME` | — | Not supported by V2 |

Current date and time limits:

- Every source value must be a valid Doris date or timestamp. Invalid values return `INVALID_ARGUMENT`; they are not repaired or converted to `NULL`.
- `DATETIME` and `DATETIMEV2` keep wall-clock, no-time-zone semantics. This conversion does not apply the session time zone.
- `TIMESTAMPTZ` is the supported input that keeps time-zone-adjusted timestamp semantics.
- V2 date and time conversion supports microsecond precision, not nanosecond precision.

## NULL semantics

SQL `NULL` and Variant/JSON `null` are different values:

- SQL `NULL` represents the absence of a SQL value and participates in normal SQL null propagation.
- Variant/JSON `null` is a Variant value produced, for example, by `parse_to_variant('null')`.
- `parse_to_variant_error_to_null` returns SQL `NULL` for malformed input; this is different from successfully parsing the JSON literal `null`.

## Current limitations

- Root Variant comparison predicates (`=`, `!=`, `<=>`, `<`, `<=`, `>`, and `>=`) are not supported. Extract and cast a comparable path on both sides.
- Variant expressions are not supported as join keys.
- Root Variant values are not supported as Sort/TopN keys or as window partition or order keys.
- Root Variant values are not supported as arguments to `MIN` or `MAX`.
- Decimal values with precision greater than 38 and `TIME` values are not supported V2 inputs.
- Feature selection is session-scoped and does not change persisted Variant data.
- Enable V2 only after validating the target workload; the feature remains experimental.

```sql
-- Compare concrete subpaths rather than root Variant values.
SELECT *
FROM tbl
WHERE CAST(v['id'] AS BIGINT) = CAST(other_v['id'] AS BIGINT);
```
