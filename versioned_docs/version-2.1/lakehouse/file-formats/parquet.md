---
{
    "title": "Parquet | File Formats",
    "language": "zh-CN",
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

## Supported Compression Formats

* uncompressed
* snappy
* lz4
* zstd
* gzip
* lzo
* brotli

## Parameters

### Session Variables

* `enable_parquet_lazy_mat` (2.1+, 3.0+)

    Controls whether the Parquet Reader enables lazy materialization. Default is true.

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    When reading Parquet data types from Hive tables, Doris will, by default, read data from columns in the Parquet file that have the same name as the columns in the Hive table. When this variable is set to `false`, Doris will read data from the Parquet file based on the column order in the Hive table, regardless of column names. This is similar to the `parquet.column.index.access` variable in Hive. This parameter only applies to top-level column names and is ineffective for columns inside Structs.

### BE Configuration

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Determines whether the Parquet Reader uses the Page Index to filter data. This is only for debugging purposes, in case the page index sometimes filters incorrect data. Default value is false.

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    The maximum buffer size allocated when reading the Parquet Page header. Default is 1M.

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    The maximum buffer size allocated when reading a Parquet Row Group. Default is 128M.

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    The maximum buffer size allocated when reading a Column within a Parquet Row Group. Default is 8M.


