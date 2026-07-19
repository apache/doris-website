---
{
    "title": "VARIANT V2 Compute Semantics and Memory Encoding",
    "language": "en-US",
    "description": "Architecture and behavioral reference for the experimental ColumnVariantV2 compute path, including memory states, scalar encoding, canonical equality, CAST and parsing semantics, and current limitations."
}
---

## Overview

`ColumnVariantV2` is an experimental, compute-only execution path for `VARIANT`. It adds a self-describing in-memory representation and canonical value semantics for supported expressions, grouping, and set operations.

Use the [VARIANT type reference](./VARIANT) for SQL syntax, type rules, indexes, storage configuration, and general limitations. Use the [VARIANT Workload Guide](./variant-workload-guide) when choosing between default storage behavior, sparse columns, DOC mode, and Schema Template. This page focuses on the V2 execution architecture and behavior.

:::caution Experimental feature
`ColumnVariantV2` is disabled by default. It changes only the compute path selected for the current FE session. It does not introduce a V2 table format, loading path, segment reader or writer, statistics format, or compaction path, and it does not provide V1/V2 mixed-version rolling-upgrade compatibility.
:::

## Enable the compute path

Enable V2 for the current FE session with the session variable `enable_variant_v2`:

```sql
SET enable_variant_v2 = true;
```

The session variable changes the FE/BE execution type marker only. Existing persisted `VARIANT` data and its storage compatibility contract remain unchanged.

## Execution architecture

### Whole-column state model

A `ColumnVariantV2` column has one physical state for the whole column:

- **Typed scalar (`T`)**: homogeneous scalar rows borrow a concrete Doris scalar column and its data type. A separate Variant-null map represents Variant/JSON `null`.
- **Encoded (`E`)**: nested, heterogeneous, or materialized values are stored as self-describing bytes in an arena.
- A column does not mix `T` and `E` at row granularity. SQL `NULL` remains in the SQL nullable bitmap and is distinct from Variant/JSON `null` in either state.

This distinction lets simple scalar expressions avoid immediate encoding while allowing nested or heterogeneous operators to consume one uniform representation when required.

### Main components

| Component | Responsibility |
| --- | --- |
| `ColumnVariantV2` | Owns the whole-column `T` or `E` state, null semantics, read views, and materialization entry points. |
| `VariantBlockBuilder` | Builds encoded scalar, array, and object rows and appends their self-describing bytes to the arena. |
| `VariantScalarEncodingPlan` | Selects a primitive ID, payload width, scale or length metadata, validates limits, and writes the encoded scalar bytes. |
| `with_typed_scalar()` | Central typed-scalar mapping matrix. It creates both the physical encoding plan and the canonical scalar view for a Doris value. |
| `VariantCanonicalScalarRef` | Represents the logical scalar used by canonical hashing and serialization, independently of physical width or source type. |
| Variant V2 CAST and parser functions | Define the boundary between typed SQL values, Variant strings, and parsed JSON values. |

### Typed-to-encoded materialization flow

1. A supported homogeneous scalar can enter the compute path in `T` state with an exact Doris scalar type.
2. Operators that only need a typed read view can borrow that state without encoding the column.
3. When an operator requires self-describing values, `ensure_encoded()` dispatches once on the Doris primitive type and visits the rows.
4. `with_typed_scalar()` produces a physical encoding factory and a canonical-value factory for each non-null row.
5. `VariantScalarEncodingPlan` writes the physical value to the arena, after which the column is represented in `E` state for subsequent encoded operations.

This centralized mapping keeps physical serialization and canonical equality aligned while avoiding a virtual or type switch for every row.

## Memory encoding and organization

The encoded representation carries the primitive type and any required scale or length metadata next to the payload. Arrays and objects additionally carry enough structural information to locate child values. This representation is designed for compute-time traversal rather than persisted table storage.

The organization is conceptually similar to separating an encoded Variant value from optional typed projections. For external format references, see the official [Apache Parquet File Format](https://parquet.apache.org/docs/file-format/), [Parquet Variant Shredding](https://parquet.apache.org/docs/file-format/types/variantshredding/), and [Parquet Nested Encoding](https://parquet.apache.org/docs/file-format/nestedencoding/). Parquet organizes a Variant around `metadata` and `value`, with optional `typed_value` fields for homogeneous paths. This is an organizational reference; `ColumnVariantV2` does not use Parquet as its in-memory or Doris on-disk format.

## Typed scalar materialization mappings

### Decimal types

When a typed Decimal is materialized from `T` to `E`, `with_typed_scalar()` preserves its unscaled integer and scale and selects the payload width from the Doris source type:

| Doris type | Unscaled value read from the column | Encoding call | Variant primitive |
| --- | --- | --- | --- |
| `DECIMALV2` | `__int128` from `DecimalV2Value::value()` | `decimal(value, scale, 16)` | `DECIMAL16` |
| `DECIMAL32` | `int32_t` from `Decimal32::value` | `decimal(value, scale, 4)` | `DECIMAL4` |
| `DECIMAL64` | `int64_t` from `Decimal64::value` | `decimal(value, scale, 8)` | `DECIMAL8` |
| `DECIMAL128I` | `__int128` from `Decimal128V3::value` | `decimal(value, scale, 16)` | `DECIMAL16` |

The encoded decimal layout is `[primitive header][scale][little-endian signed unscaled value]`. Its total size is 6 bytes for `DECIMAL4`, 10 bytes for `DECIMAL8`, and 18 bytes for `DECIMAL16`.

Decimal limits and invariants:

- The Variant decimal scale must be in `[0, 38]`. The absolute unscaled value is limited to `10^9 - 1` for `DECIMAL4`, `10^18 - 1` for `DECIMAL8`, and `10^38 - 1` for `DECIMAL16`.
- Doris source-type limits still apply: `DECIMALV2` supports precision up to 27 and scale up to 9; `DECIMAL32`, `DECIMAL64`, and `DECIMAL128I` support precision up to 9, 18, and 38 respectively.
- The typed column's physical scale must exactly match its data-type metadata. A mismatch is an invariant violation; materialization does not rescale the value.
- The source type determines the encoded width. A small `DECIMALV2` or `DECIMAL128I` value is not narrowed to `DECIMAL4` or `DECIMAL8` on this path.
- `DECIMAL256` is not a supported `ColumnVariantV2` typed identity. Its precision can reach 76, beyond the Variant decimal precision limit of 38.
- Physical width and scale do not define canonical equality. For example, `1.20` and `1.2` can have different physical encodings but normalize to the same canonical numeric value.

### Date and time types

The date and timestamp mapping first calculates:

```text
days = daynr(value) - daynr(1970-01-01)
micros = (days * 86400 + hour * 3600 + minute * 60 + second) * 1000000
         + microsecond
```

| Doris type | Normalized payload | Encoding call | Variant primitive |
| --- | --- | --- | --- |
| `DATE` | `int32_t days` | `date(days)` | `DATE` |
| `DATEV2` | `int32_t days` | `date(days)` | `DATE` |
| `DATETIME` | `int64_t micros` | `timestamp_micros(micros, false)` | `TIMESTAMP_NTZ_MICROS` |
| `DATETIMEV2` | `int64_t micros` | `timestamp_micros(micros, false)` | `TIMESTAMP_NTZ_MICROS` |
| `TIMESTAMPTZ` | `int64_t micros` | `timestamp_micros(micros, true)` | `TIMESTAMP_MICROS` |

`DATE` uses a 4-byte payload plus a 1-byte header. Each timestamp uses an 8-byte payload plus a 1-byte header. The `utc_adjusted` argument is represented by the primitive ID: `false` selects the no-time-zone (`NTZ`) primitive, while `true` selects the UTC-adjusted primitive.

Date and time limits and invariants:

- Every source value must pass Doris date validation. An invalid `DATE`, `DATEV2`, `DATETIME`, `DATETIMEV2`, or `TIMESTAMPTZ` raises `INVALID_ARGUMENT`; this path does not repair it or convert it to `NULL`.
- `DATE` and `DATEV2` preserve only a signed day count relative to `1970-01-01`; they carry neither a time of day nor a time-zone adjustment.
- `DATETIME` and `DATETIMEV2` are encoded as wall-clock, no-time-zone timestamps. This path does not apply the session time zone. `TIMESTAMPTZ` is the only mapped Doris type that selects the UTC-adjusted timestamp primitive.
- Typed materialization emits microsecond primitives only. `DATETIMEV2` and `TIMESTAMPTZ` preserve at most their supported six fractional digits. `TIMESTAMP_NANOS` and `TIMESTAMP_NTZ_NANOS` exist in the encoding but are not emitted by this mapping.
- `TIMEV2` is not a supported typed identity. Although the Variant encoding defines `TIME_NTZ_MICROS`, this typed-to-encoded path does not produce it.

## Canonical value semantics

Physical encoded bytes are not used directly as the equality identity. Canonicalization produces a logical representation for hashing and arena serialization:

- Equivalent integral numeric representations normalize to the same value.
- Decimal trailing zeros do not change the value.
- `+0`, `-0`, and integral zero normalize together.
- Object key order does not affect equality, while array element order does.
- Variant/JSON `null` remains distinct from SQL `NULL`.
- Invalid encodings and violated internal invariants fail instead of being silently accepted.

These rules enable supported hash-based operations including `GROUP BY`, `DISTINCT`, `COUNT(DISTINCT ...)`, `INTERSECT`, `EXCEPT`, and `UNION DISTINCT`.

```sql
SET enable_variant_v2 = true;

-- 1 and 1.0 have one canonical distinct value.
SELECT COUNT(DISTINCT value) AS distinct_count
FROM (
    SELECT PARSE_TO_VARIANT('1') AS value
    UNION ALL
    SELECT PARSE_TO_VARIANT('1.0') AS value
) AS numeric_values;
-- distinct_count: 1

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

Canonical equality does not enable root Variant comparison predicates. Direct `VARIANT = VARIANT`, null-safe equality, and ordering comparisons remain unsupported.

## CAST and parsing behavior

V2 separates creating a typed Variant string from parsing JSON text:

- `CAST(string AS VARIANT)` creates a typed Variant string. It does not parse or validate the string as JSON.
- `parse_to_variant(json_string)` strictly parses JSON text into a Variant value.
- `parse_to_variant_error_to_null(json_string)` returns SQL `NULL` when parsing or validation fails.
- Extracted Variant values should be cast to concrete SQL types before typed comparison, filtering, ordering, or arithmetic.

See [PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant) and [PARSE_TO_VARIANT_ERROR_TO_NULL](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant-error-to-null) for full function syntax.

```sql
SET enable_variant_v2 = true;

SELECT PARSE_TO_VARIANT('{\"id\": 1}') AS parsed_object,
       CAST('{\"id\": 1}' AS VARIANT) AS typed_string;

SELECT ELEMENT_AT(CAST('{\"id\": 1}' AS VARIANT), 'id') AS from_string,
       ELEMENT_AT(PARSE_TO_VARIANT('{\"id\": 1}'), 'id') AS from_json;
-- from_string: NULL; from_json: 1

SELECT PARSE_TO_VARIANT_ERROR_TO_NULL('{\"id\":') AS invalid_value;
-- invalid_value: NULL
```

Conditional expressions, nested containers, and Variant-aware `explode` can consume the V2 representation where their signatures support Variant values.

## Boundaries and limitations

- Root Variant comparison predicates (`=`, `!=`, `<=>`, and ordering comparisons) are not supported. Extract and cast a comparable path on both sides.
- Variant expressions are not supported as join keys.
- Root Variant values are not supported as sort or TopN keys, window partition or order keys, or arguments to `MIN` and `MAX`.
- Feature selection is session-scoped and does not change native Variant storage, loading, statistics, or compaction.
- V2 regression suites remain tagged `nonConcurrent`.
- Enable V2 only after validating the target workload; the execution path remains experimental.

```sql
SELECT *
FROM tbl
WHERE CAST(v['id'] AS BIGINT) = CAST(other_v['id'] AS BIGINT);
```
