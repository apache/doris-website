---
{
    "title": "FILE | Semi Structured",
    "language": "en",
    "description": "FILE fields, type constraints, and field access."
}
---

# FILE


## Type Description

- `FILE` represents a file in a query: it can refer to a remote file by location or hold its binary contents inline.
- A `FILE` value carries six fixed fields, and all six fields are nullable.
- `FILE` can be nested in `ARRAY`, `STRUCT`, and `MAP` values (as `MAP` values, not keys).

```sql
FILE
```

| Field | Type | Description |
| --- | --- | --- |
| uri | STRING | File location (nullable). |
| offset | BIGINT | Starting byte offset (nullable). |
| size | BIGINT | Declared content length in bytes (nullable). |
| content_type | STRING | MIME media type, such as `image/png` (nullable). |
| checksum | STRING | Checksum or ETag declaration, such as `ETAG:...` (nullable). |
| inline | VARBINARY | Inline binary content, subject to the `VARBINARY` value length limit (nullable). |

- MySQL query results display `FILE` as a six-field JSON object, with `inline` encoded as Base64 (empty bytes become `""`, and NULL fields become JSON `null`).

## Type Constraints

- **Query-only type**: `FILE` is available in query expressions. `FILE` columns cannot be declared in internal tables, external catalog tables, `CREATE TABLE ... AS SELECT`, `CREATE TABLE ... LIKE`, or materialized views, including `FILE` nested in `ARRAY`, `STRUCT`, `MAP`, or `AGG_STATE`.
- **No direct SQL constructor yet**: SQL `FILE` constructor functions and `FILE` table columns are not enabled in the current release; non-NULL `FILE` values will be produced by subsequent data source integrations or constructor functions.
- **No comparison, ordering, hashing, or grouping**: Whole `FILE` values and containers containing `FILE` cannot be used in comparison predicates (`=`, etc.), `IN`, `ORDER BY`, `GROUP BY`, `DISTINCT`, `UNION`/`INTERSECT`, `MAP` keys, or functions requiring comparison/ordering/deduplication (`MIN`, `MAX`, `COLLECT_SET`, `ARRAY_DISTINCT`, `ARRAY_SORT`, `ARRAY_SORTED_MERGE`, `TOPN_ARRAY`, `GROUP_ARRAY_INTERSECT`, `GROUP_ARRAY_UNION`, `GREATEST`, `LEAST`, `NULLIF`). Extract an ordinary scalar field via `ELEMENT_AT` for these operations.
- **Payload-only operations and aggregates**: Pass-through conditional expressions (`IF`, `CASE`, `COALESCE`, `NVL`), window value functions (`FIRST_VALUE`, `LAST_VALUE`, `NTH_VALUE`), and payload-only aggregates (`COUNT`, `ANY_VALUE`, `ARRAY_AGG`, `COLLECT_LIST`, `GROUP_ARRAY`, `MIN_BY(f, k)`, `MAX_BY(f, k)`, `MAP_AGG(k, f)`) support `FILE` and containers containing `FILE`.
- **No CAST / TRY_CAST**: `CAST` and `TRY_CAST` reject conversions to or from `FILE` (including `NULL`, identity casts, and nested `FILE`). See [FILE Type Conversion](../conversion/file-conversion.md).
- **No UDFs or file export**: `FILE` and nested `FILE` are unsupported as UDF/UDAF/UDTF arguments, return values, or aggregate intermediate types, as well as in `SELECT ... INTO OUTFILE`, Arrow/Flight output, and ORC output.

## Element Access

- Use [FL_GET_BINARY](../../../sql-functions/scalar-functions/fl-get-binary.md) to read the stored `inline` binary contents. A NULL `FILE` or NULL `inline` field returns `NULL`.
- Read `uri`, `offset`, `size`, `content_type`, or `checksum` with [ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at.md) (`ELEMENT_AT(f, 'field_name')` or `f['field_name']`). The field name must be a non-NULL constant string and is case-insensitive. The `inline` selector, unknown field names, dynamic selectors, and numeric indexes produce errors.
- Expand all six fields into separate columns with [EXPLODE_FILE](../../../sql-functions/table-functions/explode-file.md) or [EXPLODE_FILE_OUTER](../../../sql-functions/table-functions/explode-file-outer.md).
- Convert a `FILE` value to `JSONB` with [TO_JSON](../../../sql-functions/scalar-functions/json-functions/to-json.md).

The following queries illustrate the expected usage once a data source provides a `FILE` column `f` (SQL `FILE` constructors and table columns are not yet enabled in this release):

```sql
-- Metadata fields via ELEMENT_AT (or bracket syntax); inline bytes via FL_GET_BINARY
SELECT
    ELEMENT_AT(f, 'uri')          AS uri,
    f['offset']                   AS file_offset,
    ELEMENT_AT(f, 'size')         AS file_size,
    ELEMENT_AT(f, 'content_type') AS content_type,
    ELEMENT_AT(f, 'checksum')     AS checksum,
    FL_GET_BINARY(f)              AS file_inline
FROM file_source;

-- Expand all six fields via EXPLODE_FILE / EXPLODE_FILE_OUTER
SELECT u, o, s, c, h, b
FROM file_source
LATERAL VIEW EXPLODE_FILE(f) e AS u, o, s, c, h, b;
```
