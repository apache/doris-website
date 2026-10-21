---
{
    "title": "데이터 적재 메모리 분석",
    "language": "ko",
    "description": "Doris 데이터 적재는 fragment 읽기와 channel 쓰기의 두 단계로 나뉩니다. 데이터 적재 fragment와 쿼리 fragment의 실행 로직은 동일하며,"
}
---

Doris 데이터 적재는 fragment 읽기와 channel 쓰기의 두 단계로 나뉩니다. 데이터 적재 fragment와 쿼리 fragment의 실행 로직은 동일하지만, Stream Load에는 일반적으로 Scan Operator만 있습니다. Channel은 주로 임시 데이터 구조인 Memtable에 데이터를 쓰고, 이후 Delta Writer가 데이터를 압축하여 파일에 씁니다.

## 데이터 적재 메모리 현황 {#load-memory-view}

어디에서든 `Label=load, Type=overview` Memory Tracker의 값이 크게 표시된다면 데이터 적재에 많은 메모리를 사용하고 있다는 뜻입니다.

```
MemTrackerLimiter Label=load, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

Doris의 데이터 적재 메모리는 두 부분으로 나뉩니다. 첫 번째는 fragment 실행에 사용되는 메모리이고, 두 번째는 MemTable을 구성하고 flush하는 과정에서 사용되는 메모리입니다.

`Label=AllMemTableMemory, Parent Label=DetailsTrackerSet` Memory Tracker는 BE 웹 페이지 `http://{be_host}:{be_web_server_port}/mem_tracker?type=global`에서 확인할 수 있으며, 이 BE 노드의 모든 데이터 적재 작업이 `MemTable`을 구성하고 flush하는 데 사용하는 메모리를 나타냅니다. 프로세스 메모리가 제한을 초과하거나 사용 가능한 메모리가 부족하다는 오류가 발생하면, 이 Memory Tracker를 `Memory Tracker Summary`에서도 확인할 수 있습니다. 이 요약 정보는 `be.INFO` 로그에 기록됩니다.

```
MemTracker Label=AllMemTableMemory, Parent Label=DetailsTrackerSet, Used=25.08 MB(26303456 B), Peak=25.08 MB(26303456 B)
```

## 데이터 적재 메모리 분석 {#load-memory-analysis}

`Label=AllMemTableMemory`의 값이 작다면 데이터 적재 작업이 사용하는 메모리의 대부분은 fragment 실행에 사용됩니다. 분석 방법은 [쿼리 메모리 분석](./query-memory-analysis.md)과 동일하므로 여기서는 다시 설명하지 않습니다.

`Label=AllMemTableMemory`의 값이 크다면 MemTable이 제때 flush되지 않는 것일 수 있습니다. `load_process_max_memory_limit_percent`와 `load_process_soft_mem_limit_percent`의 값을 `be.conf`에서 낮추는 것을 고려할 수 있습니다. 이렇게 하면 MemTable이 더 자주 flush되어 메모리에 캐시되는 MemTable 수가 줄어들지만, 기록되는 파일 수는 늘어납니다. 작은 파일이 너무 많이 기록되면 compaction 부하가 증가합니다. compaction이 제때 수행되지 않으면 메타데이터 메모리가 증가하고 쿼리가 느려지며, 파일 수가 제한을 초과하면 데이터 적재 중에도 오류가 발생할 수 있습니다.

데이터 적재가 실행되는 동안 BE 웹 페이지 `/mem_tracker?type=load`를 확인하세요. 두 메모리 트래커 그룹인 `Label=MemTableManualInsert`와 `Label=MemTableHookFlush`의 값을 바탕으로, `LoadID`와 `TabletID` 중 `MemTable` 메모리 사용량이 큰 항목을 찾을 수 있습니다.
