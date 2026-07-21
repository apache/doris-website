---
{
    "title": "Parquet | File Formats",
    "language": "zh-CN",
    "description": "本文档用于介绍 Doris 的 Parquet 文件格式的读写支持情况。该文档适用于以下功能。",
    "sidebar_label": "Parquet"
}
---

# Parquet

本文档用于介绍 Doris 的 Parquet 文件格式的读写支持情况。该文档适用于以下功能。

* Catalog 中对数据的读取、写入操作。

* Table Valued Function 中对数据的读取操作。

* Broker Load 中对数据的读取操作。

* Export 中对数据的写入操作。

* Outfile 中对数据的写入操作。

## INT96 时间戳解码

Parquet `INT96` 存储日期和时间字段，但不包含时区标注。因此 FileScannerV2 默认保留原始墙上时间值，而不会根据 SQL 会话时区产生偏移。例如，映射到 `DATETIMEV2` 时，原始值 `2021-01-01 10:11:00` 在 Catalog 扫描、表值函数和 Broker Load 中均保持为 `10:11:00`。

该行为仅适用于 `INT96`。带时间戳逻辑类型的 Parquet `INT64` 值仍遵循逻辑类型语义。如果旧版 Hive 写入端按已知时区归一化过 `INT96` 值，请在 [Hive Catalog](../catalogs/hive-catalog.mdx#timestamp-compatibility) 中配置 `hive.parquet.time-zone`。外部文件表值函数也接受该属性。其他 FileScannerV2 入口会保留原始 `INT96` 墙上时间值。

`INT96` 列映射到 `TIMESTAMPTZ` 时，Doris 会保留 UTC 时刻，而不应用兼容时区。

## 支持的压缩格式

* umcomressed

* snappy

* lz4

* zstd

* gzip

* lzo

* brotli

## 相关参数

### 会话变量

* `enable_parquet_lazy_mat` (2.1+, 3.0+)

    控制 Parquet Reader 是否启用延迟物化技术。默认为 true。

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    Doris 在读取 Hive 表 Parquet 数据类型时，默认会根据 Hive 表的列名从 Parquet 文件中找同名的列来读取数据。当该变量为 `false` 时，Doris 会根据 Hive 表中的列顺序从 Parquet 文件中读取数据，与列名无关。类似于 Hive 中的 `parquet.column.index.access` 变量。该参数只适用于顶层列名，对 Struct 内部无效。 

### BE 配置

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet Reader 是否采用 Page Index 去过滤数据。这仅用于调试目的，以防页面索引有时过滤错误的数据。默认值为 false.

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    读取 Parquet Page header 时所分配的最大 Buffer 大小，默认为 1M。

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    读取 Parquet Row Group 时所分配的最大 Buffer 大小，默认为 128M。

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    读取 Parquet Row Group 中的 Column 时所分配的最大 Buffer 大小，默认为 8M。

