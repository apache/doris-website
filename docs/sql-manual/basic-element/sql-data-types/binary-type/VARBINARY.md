---
{
    "title": "VARBINARY",
    "language": "en"
}
---

## VARBINARY
### Description
A variable-length binary byte sequence, where M denotes the maximum length (in bytes).

Unlike VARCHAR, it stores and compares data byte-wise with no character set or collation, suitable for arbitrary binary data (e.g., file fragments, hashes, encrypted/compressed data).

Version and limitations: Supported since 4.0; currently not supported as a column type for table creation and storage in Doris. You can map BINARY/VARBINARY fields from external systems to Doris VARBINARY via Catalogs for querying.

### keywords
VARBINARY
