---
{
    "title": "UUID Data Type",
    "sidebar_label": "UUID",
    "language": "en",
    "description": "Native 128-bit UUID type: input formats, generation, conversion, table design, and file compatibility."
}
---

## Description

`UUID` stores a 128-bit universally unique identifier in 16 bytes. Use it for identifiers that need compact storage, equality filtering, joins, or sorting. Text output always uses lowercase canonical form: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

## Syntax and input format

```sql
UUID
```

| Property | Behavior |
| --- | --- |
| Storage | Fixed 16-byte value; canonical text has 36 characters |
| Canonical input | 32 hexadecimal digits with hyphens in the `8-4-4-4-12` positions |
| Compact input | 32 hexadecimal digits without hyphens |
| Letter case | Uppercase and lowercase hexadecimal digits are accepted; output is lowercase |
| Value range | `00000000-0000-0000-0000-000000000000` through `ffffffff-ffff-ffff-ffff-ffffffffffff` |
| Validation | Checks text format, without requiring a particular UUID version or variant |
| NULL | Supported for nullable columns; the all-zero UUID is a valid value distinct from `NULL` |
| Ordering | Unsigned 128-bit order in canonical byte order, equivalent to lexicographic order of normalized canonical text |

## Basic usage

```sql
CREATE DATABASE IF NOT EXISTS uuid_demo;
USE uuid_demo;

CREATE TABLE uuid_events (
    id INT NOT NULL,
    event_id UUID NULL,
    generated_id UUID NOT NULL DEFAULT UUID_V7()
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO uuid_events (id, event_id) VALUES
    (1, '550E8400E29B41D4A716446655440000'),
    (2, '00000000-0000-0000-0000-000000000000'),
    (3, NULL);

SELECT id, event_id, UUID_VERSION(generated_id) AS generated_version
FROM uuid_events ORDER BY id;
```

```text
+----+--------------------------------------+-------------------+
| id | event_id                             | generated_version |
+----+--------------------------------------+-------------------+
| 1  | 550e8400-e29b-41d4-a716-446655440000 | 7                 |
| 2  | 00000000-0000-0000-0000-000000000000 | 7                 |
| 3  | NULL                                 | 7                 |
+----+--------------------------------------+-------------------+
```

Each omitted `generated_id` receives a generated value. Its exact text varies between executions.

```sql
SELECT id FROM uuid_events
WHERE event_id = CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID);
```

```text
+----+
| id |
+----+
| 1  |
+----+
```

## Functions and conversion

| Function | Result and purpose |
| --- | --- |
| [UUID_V4](../../sql-functions/scalar-functions/uuid-functions/uuid-v4.md) | Native random UUID v4; aliases `GENERATE_UUID_V4()` and `GENERATEUUIDV4()` |
| [UUID_V7](../../sql-functions/scalar-functions/uuid-functions/uuid-v7.md) | Native UUID v7 containing a millisecond timestamp; aliases `GENERATE_UUID_V7()` and `GENERATEUUIDV7()` |
| [UUID_VERSION](../../sql-functions/scalar-functions/uuid-functions/uuid-version.md) | `TINYINT` version field (0–15), without validating the variant |
| [TO_UUID_OR_NULL](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-null.md) | Parse text; invalid text and `NULL` return `NULL` |
| [TO_UUID_OR_ZERO](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-zero.md) | Parse text; invalid text returns the all-zero UUID, while `NULL` stays `NULL` |
| [TO_UUID_OR_DEFAULT](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-default.md) | Parse text; invalid text or `NULL` uses the supplied UUID fallback, defaulting to the all-zero UUID |
| [UUID_V7_TO_DATETIME](../../sql-functions/scalar-functions/uuid-functions/uuid-v7-to-datetime.md) | Extract the timestamp as `DATETIME(3)` in a selected time zone |
| [DATETIME_TO_UUID_V7](../../sql-functions/scalar-functions/uuid-functions/datetime-to-uuid-v7.md) | Generate a UUID v7 from a date and time interpreted in the session time zone |
| [UUID](../../sql-functions/scalar-functions/string-functions/uuid.md) | Existing function returning `VARCHAR`, rather than the native UUID type |

Use `CAST(text AS UUID)` to parse text and `CAST(uuid AS STRING)` for canonical output. With `enable_strict_cast = true`, invalid text raises an error; with it disabled, invalid text returns `NULL`. `TRY_CAST(text AS UUID)` returns `NULL` for invalid text in either mode. UUID and integer, floating-point, date/time, or IP types cannot be directly cast to each other. See [UUID conversion](conversion/uuid-conversion.md) for implicit conversion, VARIANT, and migration rules.

The existing `IS_UUID()` accepts some text, such as canonical UUIDs enclosed in braces, that the native parser rejects. Use `TO_UUID_OR_NULL()` or `TRY_CAST` to validate text for a UUID column.

## Table design and restrictions

- UUID columns can be keys in Duplicate, Unique, and Aggregate tables, hash distribution columns, and manual RANGE or LIST partition columns. Specify partition boundaries as quoted UUID text. Numeric-step batch range creation does not apply to UUID.
- UUID values support comparison, `IN`, sorting, grouping, joins, `MIN`, `MAX`, and `COUNT(DISTINCT ...)`. UUID is not a numeric type: arithmetic and numeric aggregates such as `SUM` and `AVG` are not supported.
- Aggregate-table UUID value columns support `MIN`, `MAX`, `REPLACE`, and `REPLACE_IF_NOT_NULL`.
- UUID can be an ARRAY element, a MAP key or value, or a STRUCT field. The existing constraints on the outer complex type still apply.
- UUID supports prefix, ZoneMap, BloomFilter, and inverted indexes. For an inverted index, use equality/range lookup without a text parser. UUID does not support NGRAM_BF or vector indexes.
- UUID cannot be an `AUTO_INCREMENT` column or a Sequence column.
- At table creation, UUID columns support literal defaults and dynamic defaults `UUID_V4()` / `UUID_V7()`, including their aliases. Dynamic UUID defaults are only valid for UUID columns. 
- `ALTER TABLE ADD COLUMN` accepts a UUID literal default, but rejects UUID generator defaults because existing rows cannot be backfilled with independent persistent generated values. Directly changing another column type to UUID, or UUID to another type, is not supported by schema change. Create a new column/table and convert during insertion instead.

## Loading, export, and clients

For CSV input, provide UUID text as a field; for JSON input, provide it as a JSON string or `null`. Both canonical and compact text are accepted. To choose a fallback explicitly, load the source as text and use one of the `TO_UUID_OR_*` functions in the column mapping.

| Interface or format | UUID representation |
| --- | --- |
| MySQL protocol / Arrow Flight SQL | Canonical text; a client may report a string type even when the Doris column is UUID |
| CSV, JSON, and Hive Text output | Canonical text; JSON represents UUID values as strings |
| General `OUTFILE` / `EXPORT` in Parquet or ORC | UUID values, including nested UUID elements, are exported as canonical strings; the native type is not preserved by schema inference |
| Native Parquet UUID input | Supports the UUID logical annotation on `FIXED_LEN_BYTE_ARRAY(16)`, in canonical big-endian byte order. TVF schema inference retains the existing STRING / VARBINARY mapping controlled by `enable_mapping_varbinary`; convert canonical STRING with `CAST(value AS UUID)`, or raw VARBINARY with `CAST(HEX(value) AS UUID)` |
| Iceberg | Catalog UUID mapping remains STRING / VARBINARY according to `enable.mapping.varbinary`. Both mappings preserve the 16 raw bytes; use `CAST(HEX(value) AS UUID)` to convert to native UUID. Writes to Iceberg UUID fields preserve the UUID logical annotation in Parquet |
| ClickHouse JDBC Catalog | ClickHouse UUID maps to native Doris UUID; earlier documented releases map it to STRING |
| Java UDF | SQL UUID maps to `java.util.UUID`, including within supported complex types |

## Best practices

Use the native type when identifiers are UUIDs and 16-byte storage or UUID comparisons are useful. Normalize and validate existing string data before migration; keep text storage if original spelling or non-UUID identifiers must be preserved. Use `UUID_V4()` for random identifiers and `UUID_V7()` for identifiers with approximate time locality. Keep a separate date/time column for event-time filtering: distributed UUID v7 generation does not provide a global sequence or an exact event timestamp.
