---
{
    "title": "메타데이터 메모리 분석",
    "language": "ko",
    "description": "Doris BE의 메모리 내 메타데이터에는 Tablet, Rowset, Segment, TabletSchema, ColumnReader, PrimaryKeyIndex 등의 데이터 구조가 포함됩니다."
}
---

Doris BE의 메모리 내 메타데이터에는 `Tablet`, `Rowset`, `Segment`, `TabletSchema`, `ColumnReader`, `PrimaryKeyIndex`, `BloomFilterIndex` 등의 데이터 구조가 포함됩니다. Doris BE 메타데이터에 대한 자세한 내용은 [Doris 스토리지 구조 설계 분석](https://blog.csdn.net/ucanuup_/article/details/115004829) 문서를 참고하세요.

## 메타데이터 확인 방법 {#metadata-viewing-method}

현재 Memory Tracker는 Doris BE의 메타데이터 메모리 크기를 정확히 집계하지 못합니다. Doris BE Bvar와 Doris BE Metrics의 일부 카운터를 확인하여 메타데이터 메모리 크기를 추정하거나, Heap Profile을 사용하여 더 자세히 분석할 수 있습니다.

### Doris BE Bvar {#doris-be-bvar}

웹 페이지 `http://{be_host}:{brpc_port}/vars`에서 Bvar가 집계한 일부 메타데이터 관련 지표를 확인할 수 있습니다.

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

### Doris BE Metrics {#doris-be-metrics}

웹 페이지 `http://{be_host}:{be_web_server_port}/metrics`에서 BE 프로세스의 메모리 모니터링(Metrics)에 포함된 일부 메타데이터 지표를 확인할 수 있습니다. 이 중 Metadata Cache 관련 지표는 [Doris 캐시 메모리 분석](./doris-cache-memory-analysis.md)을 참고하세요.

```
- `doris_be_all_rowsets_num`: The number of all Rowsets.
- `doris_be_all_segments_num`: The number of all Segments.
```

### Heap Profile을 사용한 메타데이터 메모리 분석 {#use-heap-profile-to-analyze-metadata-memory}

위의 Doris BE Bvar와 Metrics만으로 메모리 사용 지점을 정확히 파악할 수 없고, 클러스터를 쉽게 재시작할 수 있으며 현상을 재현할 수 있다면, [Heap Profile 메모리 분석](./heap-profile-memory-analysis.md)을 참고하여 메타데이터 메모리를 분석하세요.

현상을 재현한 후 Heap Profile에서 메모리 사용량이 많은 호출 스택에 `Tablet`, `Segment`, `TabletSchema`, `ColumnReader` 필드가 표시된다면, 메타데이터가 많은 메모리를 차지한다고 볼 수 있습니다.
