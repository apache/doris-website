---
{
    "title": "Анализ памяти кэша",
    "language": "ru",
    "description": "Все кэши, которыми управляет Doris, в настоящее время используют стратегию вытеснения LRU."
}
---

Все кэши, которыми управляет Doris, в настоящее время используют стратегию вытеснения LRU. Для каждого из них можно отдельно настроить ёмкость и время вытеснения с помощью параметров.

## Типы кэшей Doris {#doris-cache-type}

1. Кэш страниц

Ускоряет сканирование данных.

```
- DataPageCache: Cache data Page.
- IndexPageCache: Cache data Page index.
- PKIndexPageCache: Cache Page primary key index.
```

2. Кэш метаданных

Ускоряет чтение метаданных.

```
- SegmentCache: Cache open Segments, such as index information.
- SchemaCache: Cache Rowset Schema.
- TabletSchemaCache: Cache Tablet Schema.
- CreateTabletRRIdxCache: Cache Create Tabelt index.
- MowTabletVersionCache: Cache Mow Tablet Version.
- MowDeleteBitmapAggCache: Cache Mow DeleteBitmap.
```

3. Облачный кэш

Специализированный кэш для облачной среды.

```
- CloudTabletCache: Cache Tablet on the Cloud.
- CloudTxnDeleteBitmapCache: Cache DeleteBitmap on Cloud.
```

4. Кэш инвертированного индекса

Ускоряет работу с инвертированным индексом.

```
- InvertedIndexSearcherCache
- InvertedIndexQueryCache
```

5. Кэш точечных запросов

Ускоряет выполнение точечных запросов и используется главным образом для анализа журналов.

```
- PointQueryRowCache
- PointQueryLookupConnectionCache
```

6. Другие кэши

```
- FileCache: File cache used by external table queries and Cloud.
- CommonObjLRUCache
- LastSuccessChannelCache
```

## Способы просмотра показателей кэшей Doris {#doris-cache-view-method}

Просмотреть показатели кэшей Doris можно тремя способами.

1. Метрики Doris BE

На веб-странице `http://{be_host}:{be_web_server_port}/metrics` доступны метрики памяти процесса BE (Metrics), включая ёмкость и использование каждого кэша, количество элементов, число обращений и попаданий, а также другие показатели.

```
- `doris_be_cache_capacity{name="TabletSchemaCache"} 102400`: Cache capacity, two limiting methods: memory size or number of elements.
- `doris_be_cache_usage{name="TabletSchemaCache"} 40838`: Cache usage, memory size or number of elements, corresponding to the limit of cache capacity.
- `doris_be_cache_usage_ratio{name="TabletSchemaCache"} 0.398809`: Cache usage, equal to `(cache_usage / cache_capacity)`.
- `doris_be_cache_element_count{name="TabletSchemaCache"} 1628`: Number of cache elements, equal to Cache Usage when the cache capacity limits the number of elements.
- `doris_be_cache_lookup_count{name="TabletSchemaCache"} 63393`: Number of cache lookups.
- `doris_be_cache_hit_count{name="TabletSchemaCache"} 61765`: Number of hits when looking up the cache.
- `doris_be_cache_hit_ratio{name="TabletSchemaCache"} 0.974319`: Hit ratio, equal to `(hit_count / lookup_count)`
```

2. Bvar в Doris BE

На веб-странице `http://{be_host}:{brpc_port}/vars/*cache*` можно просмотреть специфические метрики некоторых кэшей.

> В дальнейшем показатели из метрик Doris BE будут перенесены в Bvar Doris BE.

3. Отслеживание памяти

О том, как просматривать объём памяти, занимаемый каждым кэшем, в реальном времени, см. в разделе [Глобальный анализ памяти](./global-memory-analysis.md). При возникновении ошибки, связанной с памятью, найдите `Memory Tracker Summary` в журнале `be/log/be.INFO`: эта сводка содержит сведения об объёме памяти, занимаемом кэшами на тот момент.

## Анализ памяти кэшей Doris {#doris-cache-memory-analysis}

Во время работы Doris BE используются различные кэши. Обычно следить за потреблением памяти кэшами не требуется: когда процессу BE не хватает доступной памяти, запускается GC памяти, который в первую очередь очищает кэши.

Однако слишком большой кэш увеличивает нагрузку на GC памяти, повышает вероятность ошибок запросов или загрузки из-за нехватки доступной памяти, а также риск аварийного завершения процесса BE из-за OOM. Поэтому, если памяти постоянно не хватает, можно уменьшить предельный размер кэша, отключить его или сократить время хранения записей. В некоторых сценариях уменьшение кэша может снизить производительность запросов, но в производственной среде такое снижение обычно допустимо. После изменения настроек понаблюдайте некоторое время за производительностью запросов и загрузки.

> В версиях до Doris 2.1 механизм Memory GC был несовершенен. При нехватке памяти кэш мог не освобождаться вовремя. Если памяти постоянно не хватало, часто приходилось уменьшать лимит кэша вручную.

В версиях после Doris 2.1.6 для ручной очистки всех кэшей во время работы BE выполните `curl http://{be_host}:{be_web_server_port}/api/clear_cache/all`. В ответе будет указан объём освобождённой памяти.

Ниже рассмотрены случаи, когда различные кэши занимают много памяти.

### DataPageCache занимает много памяти {#datapagecache-uses-more-memory}

- В версиях после Doris 2.1.6 выполните `curl http://{be_host}:{be_web_server_port}/api/clear_cache/DataPageCache` для ручной очистки во время работы BE.

- Выполните `curl -X POST http://{be_host}:{be_web_server_port}/api/update_config?disable_storage_page_cache=true`, чтобы отключить DataPageCache в работающем BE. По умолчанию кэш будет очищен не позднее чем через 10 минут. Однако это временная мера: после перезапуска BE DataPageCache снова включится.

- Если вы хотите надолго уменьшить объём памяти, используемой DataPageCache, см. раздел [Параметры конфигурации BE](../../../config/be-config). Уменьшите `storage_page_cache_limit` в `conf/be.conf`, чтобы снизить ёмкость DataPageCache, либо уменьшите `data_page_cache_stale_sweep_time_sec`, чтобы сократить время хранения записей в DataPageCache, либо задайте `disable_storage_page_cache=true`, чтобы отключить DataPageCache, а затем перезапустите процесс BE.

### SegmentCache занимает много памяти {#segmentcache-uses-a-lot-of-memory}

- В версиях после Doris 2.1.6 выполните `curl http://{be_host}:{be_web_server_port}/api/clear_cache/SegmentCache` для ручной очистки во время работы BE.

- Выполните `curl -X POST http:/{be_host}:{be_web_server_port}/api/update_config?disable_segment_cache=true`, чтобы отключить SegmentCache в работающем BE. По умолчанию кэш будет очищен не позднее чем через 10 минут. Однако это временная мера: после перезапуска BE SegmentCache снова включится.

- Если вы хотите надолго уменьшить объём памяти, используемой SegmentCache, см. раздел [Параметры конфигурации BE](../../../config/be-config). Измените `segment_cache_capacity` или `segment_cache_memory_percentage` в `conf/be.conf`, чтобы снизить ёмкость SegmentCache, либо уменьшите `tablet_rowset_stale_sweep_time_sec`, чтобы сократить время хранения записей в SegmentCache, либо добавьте `disable_segment_cache=true` в `conf/be.conf`, чтобы отключить SegmentCache, и перезапустите процесс BE.

### PKIndexPageCache занимает много памяти {#pkindexpagecache-uses-a-lot-of-memory}

- В версиях после Doris 2.1.6 выполните `curl http://{be_host}:{be_web_server_port}/api/clear_cache/PKIndexPageCache` для ручной очистки во время работы BE.

- См. раздел [Параметры конфигурации BE](../../../config/be-config). Уменьшите ёмкость PKIndexPageCache, снизив `pk_storage_page_cache_limit` в `conf/be.conf`, либо сократите время хранения записей в PKIndexPageCache, уменьшив `pk_index_page_cache_stale_sweep_time_sec`, либо добавьте `disable_pk_storage_page_cache=true` в `conf/be.conf`, чтобы отключить PKIndexPageCache, а затем перезапустите процесс BE.
