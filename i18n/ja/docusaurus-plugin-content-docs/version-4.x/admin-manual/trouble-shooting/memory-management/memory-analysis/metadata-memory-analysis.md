---
{
    "title": "メタデータのメモリ分析",
    "language": "ja",
    "description": "Doris BE のメモリ内メタデータには、Tablet、Rowset、Segment、TabletSchema、ColumnReader、PrimaryKeyIndex などのデータ構造が含まれます。"
}
---

Doris BE のメモリ内メタデータには、`Tablet`、`Rowset`、`Segment`、`TabletSchema`、`ColumnReader`、`PrimaryKeyIndex`、`BloomFilterIndex` などのデータ構造が含まれます。Doris BE のメタデータの詳細については、[Doris のストレージ構造設計の分析](https://blog.csdn.net/ucanuup_/article/details/115004829)を参照してください。

## メタデータの確認方法

現在、Memory Tracker では Doris BE のメタデータが使用するメモリ量を正確に計測できません。Doris BE Bvar と Doris BE Metrics の一部のカウンターを確認してメタデータのメモリ使用量を推定するか、Heap Profile を使用してさらに分析できます。

### Doris BE Bvar

Web ページ `http://{be_host}:{brpc_port}/vars` で、Bvar が計測するメタデータ関連の指標を確認できます。

```
- `doris_total_tablet_num`: The number of all tablets.
- `doris_total_rowset_num`: The number of all rowsets.
- `doris_total_segment_num`: The number of all open segments.
- `doris_total_tablet_schema_num`: The number of all tablet schemas.
- `tablet_schema_cache_count`: The number of cached tablet schemas.
- `tablet_meta_schema_columns_count`: The number of columns in all tablet schemas.
- `tablet_schema_cache_columns_count`: The number of cached columns in a tablet schema.
- `doris_column_reader_num`: The number of open column readers.
- `doris_column_reader_memory_bytes`: the number of bytes occupied by the opened Column Reader.
- `doris_ordinal_index_memory_bytes`: the number of bytes occupied by the opened Ordinal Index.
- `doris_zone_map_memory_bytes`: the number of bytes occupied by the opened ZoneMap Index.
- `doris_short_key_index_memory_bytes`: the number of bytes occupied by the opened Short Key Index.
- `doris_pk/index_reader_bytes`: the cumulative number of bytes occupied by the Primary Key Index Reader. This is not a real-time statistical value and is expected to be fixed.
- `doris_pk/index_reader_pages`: Same as above, the cumulative value of the statistics.
- `doris_pk/index_reader_cached_pages`: Same as above, the cumulative value of the statistics.
- `doris_pk/index_reader_pk_pages`: Same as above, cumulative value of statistics.
- `doris_primary_key_index_memory_bytes`: Same as above, cumulative value of statistics.
```

### Doris BE Metrics

Web ページ `http://{be_host}:{be_web_server_port}/metrics` で、BE プロセスのメモリ監視（Metrics）に含まれるメタデータ関連の指標を確認できます。Metadata Cache 関連の指標については、[Doris のキャッシュメモリ分析](./doris-cache-memory-analysis.md)を参照してください。

```
- `doris_be_all_rowsets_num`: The number of all Rowsets.
- `doris_be_all_segments_num`: The number of all Segments.
```

### Heap Profile を使用したメタデータのメモリ分析

上記の Doris BE Bvar と Metrics ではメモリ使用箇所を正確に特定できず、クラスターを容易に再起動できて現象も再現できる場合は、[Heap Profile によるメモリ分析](./heap-profile-memory-analysis.md)を参照してメタデータのメモリを分析してください。

現象を再現した後、Heap Profile のコールスタックにある `Tablet`、`Segment`、`TabletSchema`、`ColumnReader` の項目でメモリ使用量が大きい場合は、メタデータが大量のメモリを占有しているとおおむね判断できます。
