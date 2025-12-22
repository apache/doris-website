---
{
    "title": "Parquet",
    "language": "zh-CN",
    "description": "本文档用于介绍 Doris 的 Parquet 文件格式的读写支持情况。该文档适用于以下功能。"
}
---

本文档用于介绍 Doris 的 Parquet 文件格式的读写支持情况。该文档适用于以下功能。

* Catalog 中对数据的读取、写入操作。

* Table Valued Function 中对数据的读取操作。

* Broker Load 中对数据的读取操作。

* Export 中对数据的写入操作。

* Outfile 中对数据的写入操作。

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
