---
{
  "title": "メタデータメモリ解析",
  "language": "ja",
  "description": "メモリ内のDoris BEのメタデータには、Tablet、Rowset、Segment、TabletSchema、ColumnReader、PrimaryKeyIndexなどのデータ構造が含まれています。"
}
---
Doris BEのメモリ内メタデータには、`Tablet`、`Rowset`、`Segment`、`TabletSchema`、`ColumnReader`、`PrimaryKeyIndex`、`BloomFilterIndex`などのデータ構造が含まれます。Doris BEメタデータの詳細については、ドキュメント[Analysis of Doris Storage Structure Design](https://blog.csdn.net/ucanuup_/article/details/115004829)を参照してください。

## メタデータ確認方法

現在、Memory TrackerはDoris BEのメタデータメモリサイズを正確にカウントしません。Doris BE BvarとDoris BE Metricsのいくつかのカウンターを確認してメタデータメモリサイズを推定するか、Heap Profileを使用してさらに詳細な分析を行うことができます。

### Doris BE Bvar

Webページ`http://{be_host}:{brpc_port}/vars`でBvarによってカウントされるメタデータ関連の指標を確認できます。

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
- `doris_pk/index_reader_pagindex_reader_pk_pageses`: Same as above, cumulative value of statistics.
- `doris_primary_key_index_memory_bytes`: Same as above, cumulative value of statistics.
```
### Doris BE Metrics

Webページ `http://{be_host}:{be_web_server_port}/metrics` では、BEプロセスメモリ監視（Metrics）におけるいくつかのメタデータ指標を確認できます。その中で、Metadata Cache関連の指標については [Doris Cache Memory Analysis](./doris-cache-memory-analysis.md) を参照してください。

```
- `doris_be_all_rowsets_num`: The number of all Rowsets.
- `doris_be_all_segments_num`: The number of all Segments.
```
### Heap Profileを使用してメタデータメモリを分析する

上記のDoris BE BvarとMetricsを使用してメモリの場所を正確に特定できない場合、クラスタを簡単に再起動でき、現象を再現できる場合は、[Heap Profileメモリ分析](./heap-profile-memory-analysis.md)を参照してMetadataメモリを分析してください。

現象が再現された後、Heap Profileでメモリ使用量が大きいコールスタック内に`Tablet`、`Segment`、`TabletSchema`、`ColumnReader`フィールドが表示された場合、メタデータが大量のメモリを占有していることが基本的に確認できます。
