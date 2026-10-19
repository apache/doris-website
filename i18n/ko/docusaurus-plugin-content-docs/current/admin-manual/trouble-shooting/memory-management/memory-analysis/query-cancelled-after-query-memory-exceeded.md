---
{
    "title": "쿼리 오류: Memory Tracker Limit Exceeded",
    "language": "ko",
    "description": "쿼리 또는 데이터 적재 오류 메시지에 MEMLIMITEXCEEDED가 표시되고 memory tracker limit exceeded가 포함된 경우"
}
---

쿼리 또는 데이터 적재 오류 메시지에 `MEM_LIMIT_EXCEEDED`가 표시되고 `memory tracker limit exceeded`가 포함되어 있으면 작업이 단일 실행 메모리 제한을 초과했다는 의미입니다.

## 오류 메시지 분석 {#error-message-analysis}

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED] failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label :Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB. backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN _NODE (id=4)>>, can `set exec_mem_limit=8G` to change limit, details see be.INFO.
```

오류 메시지는 두 부분으로 나뉩니다.

1. `failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label:Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB`: 현재 쿼리 `f78208b15e064527-a84c5c0b04c04fcf`가 실행 중입니다. 1.03 MB의 메모리를 할당하려는 과정에서 쿼리가 단일 실행 메모리 제한을 초과한 것으로 확인되었습니다. 쿼리의 메모리 제한은 100 MB입니다(세션 변수의 `exec_mem_limit`). 현재 메모리 사용량은 99.25 MB이고, 최대 메모리 사용량은 99.29 MB입니다.

2. `backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN_NODE (id=4)>>, can set exec_mem_limit=8G to change limit, details see be.INFO.`: 메모리를 요청한 위치는 `VHASH_JOIN_NODE (id=4)`이며, `set exec_mem_limit`으로 단일 쿼리의 메모리 제한을 늘릴 수 있다는 안내가 표시됩니다.

## 단일 실행 메모리 제한과 메모리 초과 할당 {#single-execution-memory-limit-and-memory-over-issuance}

`show variables;`로 Doris 세션 변수를 확인할 수 있습니다. 이 중 `exec_mem_limit` 값은 개별 쿼리와 데이터 적재의 실행 메모리 제한입니다. 다만 Doris 1.2부터는 쿼리에 더 유연한 메모리 제한을 설정할 수 있도록 쿼리 메모리 초과 할당(overcommit)을 지원합니다. 메모리가 충분하면 쿼리의 메모리 사용량이 상한을 초과하더라도 취소되지 않으므로, 일반적으로 사용자는 쿼리 메모리 사용량에 신경 쓸 필요가 없습니다. 메모리가 부족해지면 쿼리는 새 메모리를 할당하려고 시도하면서 잠시 대기합니다. 이때 일정한 규칙에 따라 `mem_used` 대비 `exec_mem_limit`의 비율이 큰 쿼리가 먼저 취소됩니다. 대기하는 동안 해제된 메모리 양이 요구량을 충족하면 쿼리는 계속 실행되고, 그렇지 않으면 예외가 발생하며 쿼리가 종료됩니다.
## 쿼리 메모리 분석 {#query-memory-analysis}

쿼리의 메모리 사용량을 분석하려면 [쿼리 메모리 분석](./query-memory-analysis.md)을 참고하세요.

`set enable_profile=true`로 Query Profile을 활성화한 후 작업이 단일 실행 메모리 제한을 초과하면, 메모리를 요청하는 쿼리의 호출 스택이 `be/log/be.INFO`에 출력되며 쿼리의 각 연산자가 현재 사용하는 메모리와 최대 사용량도 확인할 수 있습니다. [메모리 로그 분석](./memory-log-analysis.md)을 참고하여 `Process Memory Summary`와 `Memory Tracker Summary`를 분석하면 현재 쿼리의 메모리 사용량이 예상과 일치하는지 확인하는 데 도움이 됩니다.

```sql
Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED]failed alloc size 32.00 MB, memory tracker limit exceeded, tracker label:Query#I
d=41363cb6ba734ad5-bc8720bdf9b3090d, type:query, limit 100.00 MB, peak used 75.32 MB, current used 72.62 MB. backend 10.16.10.8, process memory used 2.33 GB. exec node:<>, can `set exec_mem_limit=8G`
 to change limit, details see be.INFO.
Process Memory Summary:
    os physical memory 375.81 GB. process memory used 2.33 GB(= 2.60 GB[vm/rss] - 280.53 MB[tc/jemalloc_cache] + 0[reserved] + 0B[waiting_refresh]), limit 338.23 GB, soft limit 304.41 GB. sys availab
le memory 337.33 GB(= 337.33 GB[proc/available] - 0[reserved] - 0B[waiting_refresh]), low water mark 6.40 GB, warning water mark 12.80 GB.
Memory Tracker Summary:    MemTrackerLimiter Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Type=query, Limit=100.00 MB(104857600 B), Used=72.62 MB(76146688 B), Peak=75.32 MB(78981248 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=122.00 B(122 B), Peak=122.00 B(122 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=384.00 B(384 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=384.00 B(384 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=21.73 MB(22790276 B), Peak=21.73 MB(22790276 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=2.23 MB(2342912 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=2.23 MB(2342912 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=24.03 MB(25201284 B), Peak=24.03 MB(25201284 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=1.08 MB(1130496 B), Peak=7.17 MB(7520256 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=1.08 MB(1130496 B), Peak=7.17 MB(7520256 B)
```
