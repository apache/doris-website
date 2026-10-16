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

该行为仅适用于 `INT96`。带时间戳逻辑类型的 Parquet `INT64` 值仍遵循逻辑类型语义。如果旧版 Hive 写入端按已知时区归一化过 `INT96` 值，请在 [Hive Catalog](../catalogs/hive-catalog.mdx#timestamp-compatibility) 中配置 `hive.parquet.time-zone`。外部文件表值函数也接受该属性。其他 FileScannerV2 入口会保留原始 `INT96` 墙上时间值，但 Hudi 除外：Hudi 的原生扫描和 JNI 扫描会有意保留原有的 SQL 会话时区行为，并忽略 `hive.parquet.time-zone`。

`INT96` 列映射到 `TIMESTAMPTZ` 时，Doris 会保留 UTC 时刻，而不应用兼容时区。

## UUID 类型映射

支持读取带 UUID 逻辑标记的 `FIXED_LEN_BYTE_ARRAY(16)`，包括普通编码和字典编码，使用标准大端字节序。dev 版本普通 Parquet TVF 和 Iceberg Catalog 均将带 UUID 逻辑标记的列直接映射为原生 `UUID`，不受旧二进制映射选项影响。4.1.5 的 Parquet TVF 仍根据 `enable_mapping_varbinary` 返回标准 UUID 字符串或 VARBINARY，Iceberg UUID 则映射为 `VARBINARY(16)`。

写入 Doris `UUID` 列（包括 ARRAY、MAP 或 STRUCT 中嵌套的 UUID 元素）时，输出为带 UUID 逻辑标记的 `FIXED_LEN_BYTE_ARRAY(16)`，因此识别该标记的其他引擎可以按 UUID 还原取值；dev 版本的 Doris 读取这类文件时还原原生 UUID，包括嵌套 UUID 元素。

OUTFILE 和 EXPORT 导出 UUID 的完整类型映射见[导出文件列类型映射](../../data-operate/export/export-overview.md#导出文件列类型映射)。

## 支持的压缩格式

* umcomressed

* snappy

* lz4

* zstd

* gzip

* lzo

* brotli

## 相关参数

### 时间戳与日期兼容性（4.1.5 起）

自 4.1.5 版本起，Parquet 读写保留墙上时间与时间点的区别：不带时区的逻辑 Timestamp 映射为 `DATETIME`，`isAdjustedToUTC=true` 的逻辑 Timestamp 映射为 `TIMESTAMPTZ`。Catalog 的时间类型兼容标记、文件 TVF 的 `enable_mapping_timestamp_tz=false` 都不能再将后者改为 `DATETIME`。

Parquet INT96 本身没有时区注解，推导 Schema 时映射为 `DATETIME(6)`。Hive Catalog 和文件 TVF 支持可选属性 `hive.parquet.time-zone`，用于指定 INT96 写入端时区；默认空字符串保留墙上时间。取值须为 IANA 时区或 `-12:00` 至 `+14:00` 的 UTC 偏移，接受 `UTC` / `GMT`，拒绝 `CST`、`PRC` 等短别名。已知源文件的写入时区时再配置，例如 `"hive.parquet.time-zone" = "Asia/Shanghai"`。

自 4.1.5 版本起，Outfile / Export 的 `enable_int96_timestamps` 默认 `false`，使用逻辑 INT64 时间戳；只有需要兼容 INT96 消费端时才显式设为 `true`。Hive 表写入的兼容选择与直接导出不同，见 [Hive Catalog](../catalogs/hive-catalog.mdx)。

曾由旧 Doris 编码写出的 `0000-01-01` 至 `0000-02-28` DATE 文件需要按写入来源确认并迁移，不能仅靠升级 Reader 自动修复，详见[零年 DATE 文件迁移](../../admin-manual/cluster-management/upgrade.md#零年-date-文件迁移)。

### 会话变量

* `enable_parquet_lazy_mat` (2.1+, 3.0+)

    控制 Parquet Reader 是否启用延迟物化技术。默认为 true。

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    Doris 在读取 Hive 表 Parquet 数据类型时，默认会根据 Hive 表的列名从 Parquet 文件中找同名的列来读取数据。当该变量为 `false` 时，Doris 会根据 Hive 表中的列顺序从 Parquet 文件中读取数据，与列名无关。类似于 Hive 中的 `parquet.column.index.access` 变量。该参数只适用于顶层列名，对 Struct 内部无效。 

### BE 配置

* `parquet_metadata_size_limit`（4.1.5 起）

    原生 Parquet V2 Reader 的序列化 Footer 元数据大小上限，默认 `268435456` 字节（256 MiB），必须大于 `0`，支持动态修改。与 Page Header 上限不同；超过后返回 `Parquet v2 footer size ... exceeds metadata limit ...`。详见 [BE 配置项](../../admin-manual/config/be-config.md#parquet_metadata_size_limit)。

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet Reader 是否采用 Page Index 去过滤数据。这仅用于调试目的，以防页面索引有时过滤错误的数据。默认值为 false.

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    读取 Parquet Page header 时所分配的最大 Buffer 大小，默认为 1M。

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    读取 Parquet Row Group 时所分配的最大 Buffer 大小，默认为 128M。

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    读取 Parquet Row Group 中的 Column 时所分配的最大 Buffer 大小，默认为 8M。
