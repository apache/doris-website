---
{
    "title": "Parquet | File Formats",
    "language": "en",
    "description": "This document introduces the support for reading and writing Parquet file formats in Doris. It applies to the following features:",
    "sidebar_label": "Parquet"
}
---

# Parquet

This document introduces the support for reading and writing Parquet file formats in Doris. It applies to the following features:

* Reading and writing data in the Catalog.
* Reading data using Table Valued Functions.
* Reading data with Broker Load.
* Writing data during Export.
* Writing data with Outfile.

## INT96 Timestamp Decoding

Parquet `INT96` stores date and time fields without a time zone annotation. FileScannerV2 therefore preserves the raw wall-clock value by default instead of shifting it with the SQL session time zone. For example, a raw `2021-01-01 10:11:00` remains `10:11:00` when mapped to `DATETIMEV2`, including in Catalog scans, table-valued functions, and Broker Load.

This behavior applies only to `INT96`. Parquet `INT64` values with a timestamp logical type continue to follow the logical-type semantics. If legacy Hive writers normalized `INT96` values with a known time zone, configure `hive.parquet.time-zone` in the [Hive Catalog](../catalogs/hive-catalog.mdx#timestamp-compatibility). External file table-valued functions also accept that property. Other FileScannerV2 entry points preserve the raw `INT96` wall-clock value, except Hudi, which intentionally retains its pre-existing SQL session-time-zone behavior in both native and JNI scans and ignores `hive.parquet.time-zone`.

When an `INT96` column maps to `TIMESTAMPTZ`, Doris preserves the UTC instant rather than applying the compatibility time zone.

## UUID Type Mapping

Reading supports UUID-annotated `FIXED_LEN_BYTE_ARRAY(16)` with plain or dictionary encoding in canonical big-endian byte order. In the dev version, ordinary Parquet TVFs and Iceberg Catalogs map UUID-annotated columns directly to native `UUID`, independently of legacy binary mapping options. Doris 4.1.5 Parquet TVFs still return canonical UUID strings or VARBINARY according to `enable_mapping_varbinary`; Iceberg UUID maps to `VARBINARY(16)` in that release.

Writing a Doris `UUID` column, including a UUID element nested in ARRAY, MAP, or STRUCT, produces `FIXED_LEN_BYTE_ARRAY(16)` with the UUID logical annotation, so other engines that understand the annotation recover the value as a UUID. The dev version restores native UUID when reading these files, including nested UUID elements.

For the complete UUID output mappings in OUTFILE and EXPORT, see [Column Type Mapping for Exported Files](../../data-operate/export/export-overview.md#column-type-mapping-for-exported-files).

## Supported Compression Formats

* uncompressed
* snappy
* lz4
* zstd
* gzip
* lzo
* brotli

## Parameters

### Timestamp and Date Compatibility (Since 4.1.5) {#timestamp-and-date-compatibility}

Since 4.1.5, Parquet reads and writes preserve the distinction between wall-clock times and instants. A logical timestamp without a time zone maps to `DATETIME`; a logical timestamp with `isAdjustedToUTC=true` maps to `TIMESTAMPTZ`. Neither the Catalog compatibility property nor `enable_mapping_timestamp_tz=false` in a file TVF can restore the `DATETIME` mapping for the latter.

Parquet INT96 has no time zone annotation and is inferred as `DATETIME(6)`. Hive Catalogs and file TVFs accept the optional `hive.parquet.time-zone` property to specify the INT96 writer time zone. Its default is an empty string, which preserves wall-clock time. Use an IANA time zone or a UTC offset from `-12:00` to `+14:00`. `UTC` and `GMT` are accepted; short aliases such as `CST` and `PRC` are rejected. Set it only when the writer time zone is known, for example, `"hive.parquet.time-zone" = "Asia/Shanghai"`.

Since 4.1.5, `enable_int96_timestamps` defaults to `false` for Outfile and Export, which write logical INT64 timestamps. Set it to `true` only for consumers that require INT96. Hive table writes use a different compatibility choice; see [Hive Catalog](../catalogs/hive-catalog.mdx).

DATE files written with the old Doris encoding and containing `0000-01-01` through `0000-02-28` require migration based on their writer. Upgrading the reader alone cannot repair them. See [Year-Zero DATE File Migration](../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration).

### Session Variables

* `enable_parquet_lazy_mat` (2.1+, 3.0+)

    Controls whether the Parquet Reader enables lazy materialization. Default is true.

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    When reading Parquet data types from Hive tables, Doris will, by default, read data from columns in the Parquet file that have the same name as the columns in the Hive table. When this variable is set to `false`, Doris will read data from the Parquet file based on the column order in the Hive table, regardless of column names. This is similar to the `parquet.column.index.access` variable in Hive. This parameter only applies to top-level column names and is ineffective for columns inside Structs.

### BE Configuration

* `parquet_metadata_size_limit` (since 4.1.5)

    The maximum serialized footer metadata size for the native Parquet V2 Reader. Defaults to `268435456` bytes (256 MiB), must be greater than `0`, and supports dynamic updates. This is separate from the Page Header limit. Exceeding it returns `Parquet v2 footer size ... exceeds metadata limit ...`. See [BE Configuration](../../admin-manual/config/be-config.md#parquet_metadata_size_limit).

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Determines whether the Parquet Reader uses the Page Index to filter data. This is only for debugging purposes, in case the page index sometimes filters incorrect data. Default value is false.

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    The maximum buffer size allocated when reading the Parquet Page header. Default is 1M.

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    The maximum buffer size allocated when reading a Parquet Row Group. Default is 128M.

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    The maximum buffer size allocated when reading a Column within a Parquet Row Group. Default is 8M.
