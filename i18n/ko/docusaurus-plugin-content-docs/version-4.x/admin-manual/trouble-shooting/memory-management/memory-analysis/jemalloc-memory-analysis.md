---
{
    "title": "Jemalloc 메모리 분석",
    "language": "ko",
    "description": "Doris는 기본적으로 Jemalloc을 범용 메모리 할당자로 사용합니다. Jemalloc 자체가 차지하는 메모리에는 Cache와 Metadata가 포함됩니다."
}
---

Doris는 기본적으로 Jemalloc을 범용 메모리 할당자로 사용합니다. Jemalloc 자체가 차지하는 메모리에는 Cache와 Metadata가 포함됩니다. Cache에는 Thread Cache와 Dirty Page가 포함됩니다. 메모리 할당자의 원본 프로파일은 Doris BE의 프로세스 프로파일 웹 페이지 http://{be_host}:{be_web_server_port}/profile 의 **메모리 정보** 아래 **Jemalloc 프로파일** 섹션에서 실시간으로 확인할 수 있습니다.

## Jemalloc Cache 메모리 분석 {#jemalloc-cache-memory-analysis}

`Label=tc/jemalloc_cache, Type=overview` Memory Tracker의 값이 크면 Jemalloc 또는 TCMalloc Cache가 많은 메모리를 사용하고 있다는 의미입니다. Doris는 기본 메모리 할당자로 Jemalloc을 사용하므로, 여기서는 Jemalloc Cache가 많은 메모리를 사용하는 경우만 분석합니다.

```
MemTrackerLimiter Label=tc/jemalloc_cache, Type=overview, Limit=-1.00 B(-1 B), Used=410.44 MB(430376896 B), Peak=-1.00 B(-1 B)
```

> Doris 2.1.6 이전에는 `Label=tc/jemalloc_cache`에 Jemalloc Metadata도 포함되므로, Jemalloc Metadata의 메모리 사용량이 많아 `Label=tc/jemalloc_cache` 값이 지나치게 커졌을 가능성이 있습니다. `Label=tc/jemalloc_metadata` Memory Tracker 분석을 참고하세요.

BE 프로세스가 실행되는 동안 Jemalloc Cache는 다음 두 부분으로 구성됩니다.

- Thread Cache: 지정된 개수의 페이지를 Thread Cache에 캐시합니다. [Jemalloc opt.tcache](https://jemalloc.net/jemalloc.3.html#opt.tcache)를 참고하세요.

- Dirty Page: Arena에서 재사용할 수 있는 모든 메모리 페이지입니다.

### Jemalloc Cache 확인 방법 {#jemalloc-cache-view-method}

Doris BE의 프로세스 프로파일 웹 페이지 `http://{be_host}:{be_web_server_port}/profile`(webserver_port의 기본값은 8040)의 **메모리 정보** 아래 **Jemalloc 프로파일** 섹션에서 Jemalloc 프로파일을 확인할 수 있습니다. 다음 주요 정보를 바탕으로 Jemalloc Cache의 사용 현황을 파악합니다.

- Jemalloc 프로파일의 `tcache_bytes`는 Jemalloc Thread Cache의 총 바이트 수입니다. `tcache_bytes` 값이 크면 Jemalloc Thread Cache가 사용하는 메모리가 지나치게 많다는 의미입니다.

- Jemalloc 프로파일에서 `dirty` 열의 값들을 `extents` 테이블 전체에 걸쳐 합산한 값이 크면 Jemalloc Dirty Page가 사용하는 메모리가 지나치게 많다는 의미입니다.

### Thread Cache 메모리 사용량이 너무 큰 경우 {#thread-cache-memory-is-too-large}

Thread Cache의 상한은 페이지의 총 바이트 수가 아니라 페이지 개수로 정해지므로, 크기가 큰 페이지가 Thread Cache에 많이 캐시되어 있을 수 있습니다.

`lg_tcache_max` 값을 줄이는 것을 고려하세요. 이 설정은 `JEMALLOC_CONF`에 포함되며, `be.conf`에서 변경할 수 있습니다. `lg_tcache_max`는 캐시할 수 있는 페이지의 바이트 크기 상한입니다. 기본값은 15이며, 이는 32 KB (2^15)에 해당합니다. 이 크기를 초과하는 페이지는 Thread Cache에 캐시되지 않습니다. `lg_tcache_max`는 Jemalloc 프로파일의 `Maximum thread-cached size class`에 해당합니다.

> Doris 2.1 이전에는 `lg_tcache_max`의 기본값이 20이었으며, 이 값은 `JEMALLOC_CONF`를 통해 `be.conf`에서 설정했습니다. 이로 인해 일부 상황에서 Jemalloc Cache가 지나치게 커질 수 있습니다. Doris 2.1 이후에는 Jemalloc의 기본값인 15로 되돌렸습니다.

이는 일반적으로 BE 프로세스의 쿼리나 데이터 적재가 큰 크기 클래스의 메모리 페이지를 대량으로 요청하고 있거나, 메모리를 많이 사용하는 쿼리나 데이터 적재가 끝난 후 큰 크기 클래스의 메모리 페이지가 Thread Cache에 많이 캐시되어 있기 때문입니다. Thread Cache를 정리하는 시점은 두 가지입니다. 하나는 메모리 할당과 해제 횟수가 일정 기준에 도달했을 때 오랫동안 사용하지 않은 메모리 블록을 회수하는 시점이고, 다른 하나는 스레드가 종료될 때 모든 페이지를 회수하는 시점입니다. 여기서 문제가 되는 경우가 있습니다. 이후 스레드가 새로운 쿼리나 데이터 적재를 실행하지 않으면 더 이상 메모리를 할당하지 않고 이른바 `idle` 상태가 됩니다. 사용자는 쿼리가 끝나면 메모리가 해제되기를 기대하지만, 이 상황에서는 스레드가 종료되지 않으면 Thread Cache가 정리되지 않습니다.

그러나 일반적으로 Thread Cache에 별도로 신경 쓸 필요는 없습니다. 프로세스의 가용 메모리가 부족하고 Thread Cache 크기가 1G를 초과하면 Doris가 직접 Thread Cache를 flush합니다.

### Dirty Page 메모리 사용량이 너무 큰 경우 {#dirty-page-memory-too-large}
```
extents:        size ind       ndirty        dirty       nmuzzy        muzzy    nretained     retained       ntotal        total
                4096   0            7        28672            1         4096           21        86016           29       118784
                8192   1           11        90112            2        16384           11        90112           24       196608
               12288   2            2        24576            4        49152           45       552960           51       626688
               16384   3            0            0            1        16384            6        98304            7       114688
               20480   4            0            0            1        20480            5       102400            6       122880
               24576   5            0            0           43      1056768            2        49152           45      1105920
               28672   6            0            0            0            0           13       372736           13       372736
               32768   7            0            0            1        32768           13       425984           14       458752
               40960   8            0            0           31      1150976           35      1302528           66      2453504
               49152   9            4       196608            2        98304            3       139264            9       434176
               57344  10            0            0            1        57344            9       512000           10       569344
               65536  11            3       184320            0            0            6       385024            9       569344
               81920  12            2       147456            3       241664           38      2809856           43      3198976
               98304  13            0            0            1        86016            6       557056            7       643072
              114688  14            1       102400            1       106496           15      1642496           17      1851392
```

`dirty_decay_ms` 값을 2000 ms 이하로 줄이세요. 이 설정은 `JEMALLOC_CONF`에 포함되며, `be.conf`에서 변경할 수 있습니다. 기본 `dirty_decay_ms` 값은 `be.conf`에서 5000 ms로 설정되어 있습니다. Jemalloc은 `dirty_decay_ms`에 지정된 시간 내에 완만한 곡선을 따라 Dirty Page를 점진적으로 해제합니다. [Jemalloc opt.dirty_decay_ms](https://jemalloc.net/jemalloc.3.html#opt.dirty_decay_ms)를 참고하세요. BE 프로세스의 가용 메모리가 부족해 Minor GC 또는 Full GC가 발생하면, 정해진 전략에 따라 모든 Dirty Page를 명시적으로 해제합니다.

> Doris 2.1 이전에는 `dirty_decay_ms`의 기본값이 15000이었으며, 이 값은 `JEMALLOC_CONF`를 통해 `be.conf`에서 설정했습니다. 이로 인해 일부 상황에서 Jemalloc Cache가 지나치게 커질 수 있습니다. Doris 2.1 이후의 기본값은 5000입니다.

Jemalloc 프로파일의 `extents`에는 Jemalloc의 모든 `arena`에 대한 페이지 크기별 버킷 통계가 포함됩니다. 여기서 `ndirty`는 Dirty Page의 개수이고, `dirty`는 Dirty Page의 총 메모리 크기입니다. `stats.arenas.<i>.extents.<j>.{extent_type}_bytes`에 대한 설명은 [Jemalloc](https://jemalloc.net/jemalloc.3.html)을 참고하세요. 모든 페이지 크기의 `dirty` 값을 합하면 Jemalloc Dirty Page의 메모리 크기를 바이트 단위로 구할 수 있습니다.

## Jemalloc Metadata 메모리 분석 {#jemalloc-metadata-memory-analysis}

`Label=tc/jemalloc_metadata, Type=overview` Memory Tracker의 값이 크면 Jemalloc 또는 TCMalloc Metadata가 많은 메모리를 사용하고 있다는 의미입니다. Doris는 기본 메모리 할당자로 Jemalloc을 사용하므로, 여기서는 Jemalloc Metadata가 많은 메모리를 사용하는 경우만 분석합니다.

```
MemTrackerLimiter Label=tc/jemalloc_metadata, Type=overview, Limit=-1.00 B(-1 B), Used=144 MB(151759440 B), Peak=-1.00 B(-1 B)
```

> `Label=tc/jemalloc_metadata` Memory Tracker는 Doris 2.1.6 이후에 추가되었습니다. 이전에는 Jemalloc Metadata가 `Label=tc/jemalloc_cache` Memory Tracker에 포함되어 있었습니다.

### Jemalloc Metadata 확인 방법 {#how-to-view-jemalloc-metadata}

Doris BE의 프로세스 프로파일 웹 페이지 `http://{be_host}:{be_web_server_port}/profile`(webserver_port의 기본값은 8040)의 **메모리 정보** 아래 **Jemalloc 프로파일** 섹션에서 Jemalloc 프로파일을 확인할 수 있습니다. Jemalloc 프로파일에서 아래와 같은 Jemalloc 전체 메모리 통계를 찾으세요. 여기서 `metadata`는 Jemalloc Metadata의 메모리 크기입니다.

`Allocated: 2401232080, active: 2526302208, metadata: 535979296 (n_thp 221), resident: 2995621888, mapped: 3221979136, retained: 131542581248`

- `Allocated`: Jemalloc이 BE 프로세스에 할당한 메모리의 총 바이트 수입니다.

- `active`: Jemalloc이 BE 프로세스에 할당한 모든 페이지의 총 바이트 수입니다. Page Size의 배수이며, 일반적으로 `Allocated`보다 크거나 같습니다.

- `metadata`: Jemalloc Metadata의 총 바이트 수로, 할당 및 캐시된 페이지 수, 메모리 단편화 등의 요소와 관련이 있습니다. [Jemalloc stats.metadata](https://jemalloc.net/jemalloc.3.html#stats.metadata) 문서를 참고하세요.

- `retained`: Jemalloc이 유지하는 가상 메모리 매핑의 크기입니다. 이 매핑은 munmap 또는 유사한 방법으로 운영체제에 반환되지 않으며, 물리 메모리와 강하게 연관되어 있지는 않습니다. [Jemalloc stats.retained](https://jemalloc.net/jemalloc.3.html#stats.retained) 문서를 참고하세요.

### Jemalloc Metadata 메모리 사용량이 너무 큰 경우 {#jemalloc-metadata-memory-is-too-large}

Jemalloc Metadata의 크기는 프로세스 가상 메모리 크기와 양의 상관관계가 있습니다. 일반적으로 Doris BE 프로세스의 가상 메모리가 큰 이유는 Jemalloc이 많은 가상 메모리 매핑을 유지하기 때문이며, 이것이 앞서 설명한 `retained`입니다. Jemalloc에 반환된 가상 메모리는 기본적으로 Retained에 캐시되어 재사용을 기다리며, 자동으로도 수동으로도 해제되지 않습니다.

Jemalloc Retained가 커지는 근본적인 이유는 Doris 코드에서 메모리를 충분히 재사용하지 못해 대량의 가상 메모리를 요청해야 하고, 이 메모리가 해제된 후 Jemalloc Retained로 들어가기 때문입니다. 일반적으로 가상 메모리 크기와 Jemalloc Metadata 크기의 비율은 300-500입니다. 즉, 가상 메모리가 10T이면 Jemalloc Metadata가 20G를 차지할 수 있습니다.

Jemalloc Metadata와 Retained가 계속 증가하고 프로세스 가상 메모리가 지나치게 커지는 문제가 발생하면, Doris BE 프로세스를 정기적으로 재시작하는 방안을 고려하는 것이 좋습니다. 일반적으로 이 문제는 Doris BE가 오랫동안 실행된 후에만 발생하며, 소수의 Doris 클러스터에서만 나타납니다. 현재는 성능 저하 없이 Jemalloc Retained가 유지하는 가상 메모리 매핑을 줄일 방법이 없습니다. Doris는 메모리 사용을 지속적으로 최적화하고 있습니다.

위 문제가 자주 발생하면 다음 방법을 참고하세요.

1. 근본적인 해결 방법은 Jemalloc Retained의 가상 메모리 매핑 캐시를 끄는 것입니다. `retain:false`를 `JEMALLOC_CONF` 값 끝에 추가하도록 `be.conf`를 수정한 후 BE를 재시작하세요. 다만 쿼리 성능이 크게 저하될 수 있으며, TPC-H Benchmark 테스트의 성능은 약 3배 저하됩니다.

2. Doris 2.1에서는 Pipelinex와 Pipeline을 끄기 위해 `set global experimental_enable_pipeline_engine=false; set global experimental_enable_pipeline_x_engine=false;`를 실행할 수 있습니다. pipelinex와 pipeline이 더 많은 가상 메모리를 요청하기 때문입니다. 이 경우에도 쿼리 성능이 저하됩니다.
