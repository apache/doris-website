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

Unlike VARCHAR, it stores and compares data byte-wise with no character set or collation, suitable for arbitrary binary data (e.g., file fragments, hashes, encrypted/compressed data), with a maximum length of 2,147,483,647.

Currently, VARBINARY columns are not supported in created materialized views, or for use in Group By keys, Join Keys, and comparison predicates.

Version and limitations: Supported since 4.0; currently not supported as a column type for table creation and storage in Doris. You can map BINARY/VARBINARY fields from external systems to Doris VARBINARY via Catalogs for querying.

### keywords
VARBINARY
