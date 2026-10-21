---
{
    "title": "Lance to Doris Data Type Mapping",
    "sidebar_label": "Doris Data Type Mapping",
    "description": "Doris 4.2 Lance type mapping reference covering data types, precision, nested types, and unsupported types."
}
---

The following table describes read type mappings for Lance Catalog and Lance file TVFs in Doris 4.2 (`branch-4.2`). Doris does not support writing to Lance.

| Lance / Arrow Type | Doris Type | Description |
|---|---|---|
| `null` (nullable field) | `NULL` | Every value is SQL NULL; non-nullable Null fields are unsupported |
| `duration(s/ms/us/ns)` | `BIGINT` | Preserves the signed count in the declared unit; does not normalize to seconds |
| `bool` | `BOOLEAN` | |
| `int8` | `TINYINT` | |
| `uint8` | `SMALLINT` | Losslessly widened unsigned integer |
| `int16` | `SMALLINT` | |
| `uint16` | `INT` | Losslessly widened unsigned integer |
| `int32` | `INT` | |
| `uint32` | `BIGINT` | Losslessly widened unsigned integer |
| `int64` | `BIGINT` | |
| `uint64` | `LARGEINT` | Losslessly widened unsigned integer |
| `float16` | `FLOAT` | Widened to a 32-bit floating-point value |
| `float32` | `FLOAT` | |
| `float64` | `DOUBLE` | |
| `decimal128(P,S)` | `DECIMAL(P,S)` | Maximum precision is 38 |
| `decimal256(P,S)` | `DECIMAL(P,S)` | Maximum precision is 76 |
| `utf8`, `large_utf8` | `STRING` | |
| `arrow.json` Extension | `JSON` | Requires `utf8` or `large_utf8` storage |
| `lance.json` Extension | `JSON` | Requires `large_binary` storage; read as the logical JSON type |
| `lance.bfloat16` Extension | `FLOAT` | Requires `fixed_size_binary(2)` storage; widened to Float32 without precision loss |
| `binary`, `large_binary` | `VARBINARY(2147483647)` | |
| `fixed_size_binary(N)` | `VARBINARY(N)` | Preserves the fixed byte width |
| `date32(day)`, `date64(ms)` | `DATE` | A `date64` value must represent a complete calendar day |
| `time32(s)` | `TIME(0)` | |
| `time32(ms)` | `TIME(3)` | |
| `time64(us)`, `time64(ns)` | `TIME(6)` | Nanosecond precision is truncated to microseconds |
| Timezone-naive `timestamp(s)` | `DATETIME(0)` | Not converted according to the Session Time Zone |
| Timezone-naive `timestamp(ms)` | `DATETIME(3)` | Not converted according to the Session Time Zone |
| Timezone-naive `timestamp(us)`, `timestamp(ns)` | `DATETIME(6)` | Nanosecond precision is truncated to microseconds |
| Timezone-aware `timestamp` | `TIMESTAMPTZ(P)` | Preserves the instant and displays it in the Doris Session Time Zone |
| `struct` | `STRUCT` | Child fields are mapped recursively |
| `list`, `large_list`, `fixed_size_list` | `ARRAY` | Element types are mapped recursively |
| `map` | `MAP` | Key and value types are mapped recursively |

## Usage Notes

Timestamp precision `P` is 0 for seconds, 3 for milliseconds, and 6 for microseconds or nanoseconds. Unlike the Iceberg/Paimon nanosecond mappings, Lance nanosecond timestamps still map to `DATETIME(6)` or `TIMESTAMPTZ(6)` and are truncated to microseconds. Decimals require `1 <= P <= 76` and `0 <= S <= P`; negative scales are unsupported.

Doris recognizes these extensions through `ARROW:extension:name` metadata and validates their storage types. JSON extensions map to Doris `JSON` (internally `JSONB`). An ordinary `utf8`/`large_utf8` column containing JSON text still maps to `STRING`; its contents do not automatically change its type. JSON read support does not imply pushdown of arbitrary JSON path expressions; supported predicate forms must be checked separately.

Reading JSON, Duration, Null, and BFloat16 requires the corresponding type support in both the FE and the BEs serving the query. Older builds may still report these types as unsupported; verify schema discovery and actual reads when upgrading.

The following types are not currently supported:

- Non-nullable Arrow `null` fields.
- Arrow/Lance Extension types not listed as supported, such as Lance Blob v2; known extensions with incompatible storage types are also unsupported.
- Complex types whose child types cannot be mapped recursively.
- Arrow Dictionary types that preserve the Dictionary marker.

For an unsupported top-level column, `DESC` on a Catalog table and `DESC FUNCTION` on a Lance file TVF both preserve the column and display `unknown type: UNSUPPORTED_TYPE`. If any child of a complex type cannot be mapped, the whole top-level complex column is marked unsupported. Queries can still project only supported columns. Doris reports an error during analysis when SQL projects an unsupported column. For example:

```sql
SELECT * EXCEPT(blob_col)
FROM lance_catalog.default.all_types;
```

:::note
Some Lance Java SDK versions may lose the Dictionary marker while reading a Schema and expose a Dictionary column as its physical index type. This behavior does not mean that Doris supports the logical Dictionary values and must not be relied upon.
:::

Implementation reference: [LanceTypeConverter.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/lance/metadata/LanceTypeConverter.java) (`branch-4.2`).
