---
{
    "title": "Анализ использования памяти метаданными",
    "language": "ru",
    "description": "Метаданные Doris BE в памяти включают такие структуры данных, как Tablet, Rowset, Segment, TabletSchema, ColumnReader, PrimaryKeyIndex,"
}
---

Метаданные Doris BE, хранящиеся в памяти, включают такие структуры данных, как `Tablet`, `Rowset`, `Segment`, `TabletSchema`, `ColumnReader`, `PrimaryKeyIndex` и `BloomFilterIndex`. Подробнее о метаданных Doris BE см. в документе [Анализ архитектуры хранения Doris](https://blog.csdn.net/ucanuup_/article/details/115004829).

## Способы просмотра метаданных {#metadata-viewing-method}

В настоящее время Memory Tracker не позволяет точно определить объём памяти, занимаемой метаданными Doris BE. Этот объём можно оценить по некоторым счётчикам Doris BE Bvar и Doris BE Metrics или подробнее проанализировать с помощью Heap Profile.

### Doris BE Bvar {#doris-be-bvar}

Некоторые показатели, связанные с метаданными и учитываемые Bvar, доступны на странице `http://{be_host}:{brpc_port}/vars`.

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

На странице `http://{be_host}:{be_web_server_port}/metrics` представлены некоторые показатели метаданных из мониторинга памяти процесса BE (Metrics). Сведения о показателях, относящихся к Metadata Cache, приведены в документе [Анализ использования памяти кэшем Doris](./doris-cache-memory-analysis.md).

```
- `doris_be_all_rowsets_num`: The number of all Rowsets.
- `doris_be_all_segments_num`: The number of all Segments.
```

### Анализ памяти метаданных с помощью Heap Profile {#use-heap-profile-to-analyze-metadata-memory}

Если с помощью описанных выше Doris BE Bvar и Metrics не удаётся точно определить источник потребления памяти, а кластер можно легко перезапустить и воспроизвести наблюдаемую ситуацию, обратитесь к документу [Анализ памяти с помощью Heap Profile](./heap-profile-memory-analysis.md) для анализа памяти, занимаемой метаданными.

Если после воспроизведения ситуации в стеке вызовов Heap Profile обнаруживаются поля `Tablet`, `Segment`, `TabletSchema` и `ColumnReader` с большим потреблением памяти, можно с высокой уверенностью заключить, что метаданные занимают значительный объём памяти.
