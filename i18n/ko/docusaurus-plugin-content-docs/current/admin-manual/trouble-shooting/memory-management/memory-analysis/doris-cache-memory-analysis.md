---
{
    "title": "캐시 메모리 분석",
    "language": "ko",
    "description": "Doris가 관리하는 캐시는 현재 모두 LRU 제거 전략을 사용합니다."
}
---

Doris가 관리하는 캐시는 현재 모두 LRU 제거 전략을 사용하며, 각 캐시의 용량과 제거 시점을 파라미터로 개별 제어할 수 있습니다.

## Doris 캐시 유형 {#doris-cache-type}

1. 페이지 캐시

데이터 스캔 속도를 높이는 데 사용됩니다.

```
- DataPageCache: Cache data Page.
- IndexPageCache: Cache data Page index.
- PKIndexPageCache: Cache Page primary key index.
```

2. 메타데이터 캐시

메타데이터 읽기 속도를 높이는 데 사용됩니다.

```
- SegmentCache: Cache open Segments, such as index information.
- SchemaCache: Cache Rowset Schema.
- TabletSchemaCache: Cache Tablet Schema.
- CreateTabletRRIdxCache: Cache Create Tabelt index.
- MowTabletVersionCache: Cache Mow Tablet Version.
- MowDeleteBitmapAggCache: Cache Mow DeleteBitmap.
```

3. 클라우드 캐시

클라우드 전용 캐시입니다.

```
- CloudTabletCache: Cache Tablet on the Cloud.
- CloudTxnDeleteBitmapCache: Cache DeleteBitmap on Cloud.
```

4. 역색인 캐시

역색인 처리 속도를 높입니다.

```
- InvertedIndexSearcherCache
- InvertedIndexQueryCache
```

5. 포인트 쿼리 캐시

포인트 쿼리 실행 속도를 높이며, 주로 로그 분석에 사용됩니다.

```
- PointQueryRowCache
- PointQueryLookupConnectionCache
```

6. 기타 캐시

```
- FileCache: File cache used by external table queries and Cloud.
- CommonObjLRUCache
- LastSuccessChannelCache
```

## Doris 캐시 확인 방법 {#doris-cache-view-method}

Doris 캐시 관련 지표를 확인하는 방법은 세 가지입니다.

1. Doris BE Metrics

웹 페이지 `http://{be_host}:{be_web_server_port}/metrics`에서 BE 프로세스의 메모리 모니터링 지표(Metrics)를 확인할 수 있습니다. 각 캐시의 용량, 사용량, 요소 수, 조회 횟수, 적중 횟수 등의 지표가 포함됩니다.

```
- `doris_be_cache_capacity{name="TabletSchemaCache"} 102400`: Cache capacity, two limiting methods: memory size or number of elements.
- `doris_be_cache_usage{name="TabletSchemaCache"} 40838`: Cache usage, memory size or number of elements, corresponding to the limit of cache capacity.
- `doris_be_cache_usage_ratio{name="TabletSchemaCache"} 0.398809`: Cache usage, equal to `(cache_usage / cache_capacity)`.
- `doris_be_cache_element_count{name="TabletSchemaCache"} 1628`: Number of cache elements, equal to Cache Usage when the cache capacity limits the number of elements.
- `doris_be_cache_lookup_count{name="TabletSchemaCache"} 63393`: Number of cache lookups.
- `doris_be_cache_hit_count{name="TabletSchemaCache"} 61765`: Number of hits when looking up the cache.
- `doris_be_cache_hit_ratio{name="TabletSchemaCache"} 0.974319`: Hit ratio, equal to `(hit_count / lookup_count)`
```

2. Doris BE Bvar

웹 페이지 `http://{be_host}:{brpc_port}/vars/*cache*`에서 일부 캐시에만 있는 고유 지표를 확인할 수 있습니다.

> 향후 Doris BE Metrics의 지표는 Doris BE Bvar로 이전될 예정입니다.

3. 메모리 추적기

각 캐시가 차지하는 메모리 크기를 실시간으로 확인하려면 [전역 메모리 분석](./global-memory-analysis.md)을 참조하세요. 메모리 오류가 발생하면 `Memory Tracker Summary`를 `be/log/be.INFO` 로그에서 찾아볼 수 있으며, 여기에는 해당 시점의 캐시 메모리 크기가 포함되어 있습니다.

## Doris 캐시 메모리 분석 {#doris-cache-memory-analysis}

Doris BE가 실행되는 동안에는 다양한 캐시가 사용됩니다. 일반적으로 캐시 메모리에 신경 쓸 필요는 없습니다. BE 프로세스의 가용 메모리가 부족해지면 메모리 GC가 실행되어 캐시부터 정리하기 때문입니다.

하지만 캐시가 너무 크면 메모리 GC의 부담이 커지고, 쿼리나 데이터 적재 과정에서 가용 메모리 부족으로 오류가 발생할 위험이 높아지며, BE 프로세스에서 OOM Crash가 발생할 위험도 높아집니다. 따라서 메모리가 지속적으로 부족하다면 캐시 상한을 낮추거나, 캐시를 비활성화하거나, 캐시 항목의 유지 시간을 줄이는 방법을 고려할 수 있습니다. 캐시 크기를 줄이면 일부 상황에서 쿼리 성능이 저하될 수 있지만, 일반적으로 운영 환경에서는 허용할 수 있는 수준입니다. 조정 후에는 일정 기간 쿼리 및 데이터 적재 성능을 관찰하면 됩니다.

> Doris 2.1 이전에는 메모리 GC가 완전하지 않아 메모리가 부족할 때 캐시가 제때 해제되지 않을 수 있었습니다. 메모리가 지속적으로 부족한 경우에는 캐시 상한을 수동으로 낮추는 방법을 고려해야 할 때가 많았습니다.

Doris 2.1.6 이후에는 BE 실행 중에 모든 캐시를 수동으로 정리하려면 `curl http://{be_host}:{be_web_server_port}/api/clear_cache/all`을 실행하면 됩니다. 실행 결과로 해제된 메모리 크기가 반환됩니다.

다음은 각 캐시의 메모리 사용량이 많은 경우에 대한 분석입니다.

### DataPageCache의 메모리 사용량이 많은 경우 {#datapagecache-uses-more-memory}

- Doris 2.1.6 이후에는 `curl http://{be_host}:{be_web_server_port}/api/clear_cache/DataPageCache`를 실행하여 BE 실행 중에 캐시를 수동으로 정리할 수 있습니다.

- `curl -X POST http://{be_host}:{be_web_server_port}/api/update_config?disable_storage_page_cache=true`를 실행하면 실행 중인 BE의 DataPageCache가 비활성화되며, 기본적으로 최대 10분 이내에 캐시가 정리됩니다. 다만 이는 임시 조치이며, BE를 다시 시작하면 DataPageCache가 다시 활성화됩니다.

- 장기적으로 DataPageCache의 메모리 사용량을 줄이기로 결정했다면 [BE 설정 항목](../../../config/be-config)을 참조하여 `storage_page_cache_limit` 값을 `conf/be.conf`에서 낮춰 DataPageCache의 용량을 줄이거나, `data_page_cache_stale_sweep_time_sec` 값을 낮춰 DataPageCache의 캐시 유지 시간을 줄이거나, `disable_storage_page_cache=true`를 추가하여 DataPageCache를 비활성화한 다음 BE 프로세스를 다시 시작합니다.

### SegmentCache의 메모리 사용량이 많은 경우 {#segmentcache-uses-a-lot-of-memory}

- Doris 2.1.6 이후에는 `curl http://{be_host}:{be_web_server_port}/api/clear_cache/SegmentCache`를 실행하여 BE 실행 중에 캐시를 수동으로 정리할 수 있습니다.

- `curl -X POST http:/{be_host}:{be_web_server_port}/api/update_config?disable_segment_cache=true`를 실행하면 실행 중인 BE의 SegmentCache가 비활성화되며, 기본적으로 최대 10분 이내에 캐시가 정리됩니다. 다만 이는 임시 조치이며, BE를 다시 시작하면 SegmentCache가 다시 활성화됩니다.

- 장기적으로 SegmentCache의 메모리 사용량을 줄이기로 결정했다면 [BE 설정 항목](../../../config/be-config)을 참조하여 `segment_cache_capacity` 또는 `segment_cache_memory_percentage` 값을 `conf/be.conf`에서 조정해 SegmentCache의 용량을 줄이거나, `tablet_rowset_stale_sweep_time_sec` 값을 낮춰 SegmentCache의 캐시 유지 시간을 줄이거나, `disable_segment_cache=true`를 `conf/be.conf`에 추가하여 SegmentCache를 비활성화한 다음 BE 프로세스를 다시 시작합니다.

### PKIndexPageCache의 메모리 사용량이 많은 경우 {#pkindexpagecache-uses-a-lot-of-memory}

- Doris 2.1.6 이후에는 `curl http://{be_host}:{be_web_server_port}/api/clear_cache/PKIndexPageCache`를 실행하여 BE 실행 중에 캐시를 수동으로 정리할 수 있습니다.

- [BE 설정 항목](../../../config/be-config)을 참조하여 `pk_storage_page_cache_limit` 값을 `conf/be.conf`에서 낮춰 PKIndexPageCache의 용량을 줄이거나, `pk_index_page_cache_stale_sweep_time_sec` 값을 낮춰 PKIndexPageCache의 캐시 유지 시간을 줄이거나, `disable_pk_storage_page_cache=true`를 `conf/be.conf`에 추가하여 PKIndexPageCache를 비활성화한 다음 BE 프로세스를 다시 시작합니다.
