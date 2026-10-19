---
{
    "title": "OOM Killer로 인한 비정상 종료 분석",
    "language": "ko",
    "description": "BE 프로세스가 비정상 종료된 후 log/be.out에 오류 메시지가 없으면 dmesg -T를 실행하세요. 다음 로그가 표시되면,"
}
---

BE 프로세스가 비정상 종료된 후 `log/be.out`에 오류 메시지가 없으면 `dmesg -T`를 실행하세요. 다음 로그가 표시되면 OOM Killer가 작동했다는 뜻입니다. 이 로그에서 `20240718 15:03:59`에 pid가 360303인 doris_be 프로세스의 물리 메모리(anon-rss) 사용량이 약 60 GB였음을 알 수 있습니다.

```
[Thu Jul 18 15:03:59 2024] Out of memory: Killed process 360303 (doris_be) total-vm:213416916kB, anon-rss:62273128kB, file-rss:0kB, shmem-rss:0kB, UID:0 pgtables:337048kB oom_score_adj:0
```

이상적으로는 Doris가 운영 체제의 남은 가용 메모리를 주기적으로 확인하고, 메모리가 부족하면 후속 메모리 요청 차단과 메모리 GC 실행 등의 조치를 취해 OOM Killer의 작동을 방지합니다. 하지만 메모리 상태 갱신과 메모리 GC에는 어느 정도 지연이 있으며, 대규모 메모리 요청을 모두 포착하기는 어렵습니다. 클러스터 부하가 너무 높으면 여전히 OOM Killer가 작동하여 BE 프로세스가 비정상 종료될 수 있습니다. 또한 프로세스의 메모리 상태에 이상이 있으면 메모리 GC가 메모리를 해제하지 못해 프로세스의 실제 가용 메모리가 줄어들고, 클러스터의 메모리 압박이 커집니다.

OOM Killer가 작동하면 먼저 로그를 바탕으로 작동 직전의 BE 프로세스 메모리 상태와 작업 실행 상황을 분석한 다음, 원인에 맞게 매개변수를 조정하여 클러스터를 안정화하세요.

## OOM Killer 작동 전 메모리 로그 찾기 {#find-the-memory-log-before-the-oom-killer-is-triggered}

OOM Killer가 작동했다는 것은 프로세스의 가용 메모리가 부족하다는 뜻입니다. [메모리 로그 분석](./memory-log-analysis.md)을 참고하여 OOM Killer가 작동한 시점을 기준으로 마지막으로 출력된 `Memory Tracker Summary` 키워드를 `be/log/be.INFO`에서 아래에서 위로 검색하고, BE 프로세스에서 주로 메모리를 사용하는 부분을 분석하세요.

> `less be/log/be.INFO`로 파일을 연 다음, 먼저 OOM Killer가 작동한 시점에 해당하는 로그로 이동하세요. 위의 `dmesg -T` 결과를 예로 들면, `/20240718 15:03:59`를 입력하고 Enter를 눌러 해당 시각을 검색합니다. 찾을 수 없다면 OOM Killer가 작동한 시각에 약간의 차이가 있을 수 있으므로 `/20240718 15:03:`를 검색해 보세요. 해당 시각의 로그로 이동한 후 `/Memory Tracker Summary`를 입력하고 Enter를 눌러 키워드를 검색하세요. 기본적으로 로그의 아래쪽을 검색합니다. 찾을 수 없거나 시각이 일치하지 않으면 `shift + n`을 눌러 먼저 위쪽을 검색하여 마지막으로 출력된 `Memory Tracker Summary`와 같은 시점에 출력된 `Process Memory Summary` 메모리 로그를 찾으세요.

## 과도한 클러스터 메모리 압박으로 인한 OOM Killer 작동 {#excessive-cluster-memory-pressure-triggers-oom-killer}

다음과 같은 현상이 나타나면 클러스터의 메모리 압박이 너무 높아 특정 시점에 프로세스 메모리 상태가 제때 갱신되지 않고, 메모리 GC도 제때 메모리를 해제하지 못해 BE 프로세스의 메모리를 효과적으로 제어하지 못한 것으로 볼 수 있습니다.

> Doris 2.1 이전에는 메모리 GC가 충분히 개선되지 않아 메모리가 지속적으로 부족할 때 OOM Killer가 더 쉽게 작동하는 경우가 많았습니다.

- `Memory Tracker Summary`를 분석한 결과, 쿼리와 기타 작업, 각종 캐시, 메타데이터 등의 메모리 사용량이 적정한 수준입니다.

- 해당 기간의 BE 프로세스 메모리 모니터링에서 메모리 사용률이 오랫동안 높은 수준을 유지하지만, 메모리 누수의 징후는 없습니다.

- `be/log/be.INFO`에서 OOM Killer가 작동하기 전의 메모리 로그를 찾고, 아래에서 위로 `GC` 키워드를 검색하면 BE 프로세스가 메모리 GC를 자주 실행한 것을 확인할 수 있습니다.

이 경우 [BE 설정 항목](../../../config/be-config)을 참고하여 `mem_limit`를 낮추고 `max_sys_mem_available_low_water_mark_bytes`를 높이도록 `be/conf/be.conf`를 수정하세요. 메모리 제한, 워터마크 계산 방법, 메모리 GC에 대한 자세한 내용은 [메모리 제어 전략](./../memory-feature/memory-control-strategy.md)을 참고하세요.

또한 `memory_gc_sleep_time_ms`, `soft_mem_limit_frac`, `memory_maintenance_sleep_time_ms`, `process_minor_gc_size`, `process_full_gc_size`, `thread_wait_gc_max_milliseconds` 등의 다른 매개변수를 조정하여 메모리 상태 갱신과 GC를 제어할 수 있습니다.

## 일부 이상 현상으로 인한 OOM Killer 작동 {#some-abnormal-problems-trigger-oom-killer}

클러스터의 메모리 압박이 너무 높으면 메모리 상태에 이상이 생기고 메모리 GC가 제때 메모리를 해제하지 못할 수 있습니다. 다음은 OOM Killer를 작동시키는 일반적인 이상 현상입니다.

### Memory Tracker 통계 누락 {#memory-tracker-statistics-missing}

`Label=process resident memory` Memory Tracker와 `Label=sum of all trackers` Memory Tracker 간의 차이가 로그의 `Memory Tracker Summary`에서 크게 나타나거나 Orphan Memory Tracker 값이 너무 크면, Memory Tracker의 통계에 누락이 있다는 뜻입니다. 추가 분석은 [Memory Tracker](./../memory-feature/memory-tracker.md)의 [Memory Tracker 통계 누락] 절을 참고하세요.

### 쿼리 취소 과정에서 멈춤 {#query-cancel-stuck}

`be/log/be.INFO` 로그에서 OOM Killer가 작동한 시점을 찾은 다음, 그 주변에서 `Memory Tracker Summary`를 검색하여 프로세스 메모리 통계 로그를 찾으세요. `Memory Tracker Summary`에 메모리를 많이 사용하는 쿼리가 있으면 `grep {queryID} be/log/be.INFO`를 실행하여 `Cancel` 키워드가 포함된 로그가 있는지 확인하세요. 해당 로그의 시각이 쿼리가 취소된 시점입니다. 쿼리가 이미 취소되었고, 취소 시점과 OOM Killer 작동 시점 사이에 시간이 많이 지났다면 [메모리 문제 FAQ](../../../trouble-shooting/memory-management/memory-issue-faq)의 [쿼리 취소 과정에서 멈춤]에 대한 분석을 참고하세요. `Memory Tracker Summary` 분석에 대해서는 [메모리 로그 분석](./memory-log-analysis.md)을 참고하세요.

### Jemalloc Metadata의 과도한 메모리 사용 {#jemalloc-metadata-has-a-large-memory-footprint}

현재 메모리 GC는 Jemalloc Metadata를 해제할 수 없습니다. `Label=tc/jemalloc_metadata` Memory Tracker에 대해서는 [Memory Tracker](./../memory-feature/memory-tracker.md)의 분석 내용을 참고하여 메모리 사용량을 줄이세요.

### Jemalloc Cache의 과도한 메모리 사용 {#jemalloc-cache-has-a-large-memory-footprint}

> Doris 2.0에서 흔히 발생합니다.

`lg_tcache_max` 옵션은 `JEMALLOC_CONF`에 지정되며, 이 설정은 `be.conf`에 있습니다. Doris 2.0에서 이 옵션의 기본값은 20으로, 일부 상황에서는 Jemalloc Cache가 지나치게 커지고 자동으로 해제되지 않을 수 있습니다. [Jemalloc 메모리 분석](./jemalloc-memory-analysis.md)을 참고하여 Jemalloc Cache의 메모리 사용량을 줄이세요.
