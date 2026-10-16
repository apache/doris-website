---
{
    "title": "VARBINARY",
    "language": "en",
    "description": "A variable-length binary byte sequence, where M denotes the maximum length (in bytes)."
}
---

## VARBINARY
### Description
A variable-length binary byte sequence, where M denotes the maximum length (in bytes).

Unlike VARCHAR, it preserves raw bytes without interpreting them using a character set or collation, suitable for arbitrary binary data (e.g., file fragments, hashes, encrypted/compressed data), with a maximum length of 2,147,483,647.

Currently, VARBINARY columns are not supported in created materialized views, or for use in Group By keys, Join Keys, and comparison predicates.

Version and limitations: Supported since 4.0; currently not supported as a column type for table creation and storage in Doris. You can map BINARY/VARBINARY fields from external systems to Doris VARBINARY via Catalogs for querying.

### External Types and Restrictions Since 4.1.5

Since 4.1.5, Catalogs always preserve external binary types as `VARBINARY`; `enable.mapping.varbinary=false` no longer restores the `STRING` mapping. Iceberg `fixed(N)` maps to `VARBINARY(N)`, including through Block serialization and data exchange. In the dev version, Iceberg UUID maps to native `UUID` rather than the `VARBINARY(16)` used in 4.1.5. File TVFs also always enable binary mapping in the dev version: `enable_mapping_varbinary` is accepted for compatibility but its value is ignored. In 4.1.5, that TVF option remains configurable and defaults to `false`.

Hive Text binary fields use Hive-compatible Base64 encoding and decoding. Conversions involving hexadecimal representations require a `0x` prefix and an even number of valid hexadecimal digits; invalid input returns `Invalid VARBINARY hex representation`.

This support does not enable native binary-column storage in Doris internal tables. VARBINARY cannot be used as a Hash Join or Group By key, in comparison predicates, `IN` or `NOT IN`, or in operations such as `collect_set` that lack binary semantics. Doris 4.1.5 rejects these uses explicitly.

### keywords
VARBINARY
