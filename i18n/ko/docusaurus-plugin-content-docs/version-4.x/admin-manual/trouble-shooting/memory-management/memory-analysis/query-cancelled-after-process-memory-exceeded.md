---
{
    "title": "쿼리 오류 Process Memory Not Enough",
    "language": "ko",
    "description": "쿼리의 오류 메시지에 MEMLIMITEXCEEDED가 표시되고 Process memory not enough가 포함된 경우,"
}
---

쿼리의 오류 메시지에 `MEM_LIMIT_EXCEEDED`가 표시되고 `Process memory not enough`가 포함되어 있으면 가용 메모리가 부족하여 프로세스가 취소되었음을 의미합니다.

먼저 오류 메시지를 분석하여 취소 사유, 취소 당시 쿼리 자체의 메모리 사용량, 프로세스의 메모리 상태를 확인합니다. 쿼리가 취소되는 이유는 일반적으로 다음 세 가지입니다.

1. 취소된 쿼리 자체의 메모리 사용량이 너무 큽니다.

2. 취소된 쿼리 자체의 메모리 사용량은 적지만, 메모리를 더 많이 사용하는 다른 쿼리가 있습니다.

3. 전역으로 공유되는 캐시, 메타데이터 등의 메모리 사용량이 너무 크거나, 쿼리 및 데이터 적재 작업 이외의 다른 작업이 사용하는 메모리가 너무 큽니다.

## 오류 메시지 분석 {#error-message-analysis}

프로세스의 가용 메모리가 부족해지는 상황은 두 가지입니다. 하나는 프로세스의 현재 메모리 사용량이 설정된 메모리 한도를 초과하는 경우이고, 다른 하나는 시스템의 남은 가용 메모리가 워터마크보다 낮은 경우입니다. 쿼리 등의 작업이 취소되는 경로는 세 가지입니다.

- 오류 메시지에 `cancel top memory used`가 포함되어 있으면 메모리 Full GC에서 작업이 취소되었음을 의미합니다.

- 오류 메시지에 `cancel top memory overcommit`이 포함되어 있으면 메모리 Minor GC에서 작업이 취소되었음을 의미합니다.

- 오류 메시지에 `Allocator sys memory check failed`가 포함되어 있으면 `Doris Allocator`에 메모리 할당을 요청했지만 실패하여 작업이 취소되었음을 의미합니다.

아래 오류 메시지를 분석한 후 다음과 같이 조치합니다.

- 쿼리 및 데이터 적재 작업 자체의 메모리 사용량이 프로세스 메모리에서 큰 비중을 차지한다면 [쿼리 자체의 메모리 사용량이 너무 큰 경우]를 참고하여 쿼리와 데이터 적재의 메모리 사용량을 분석하고, 매개변수를 조정하거나 SQL을 최적화하여 실행에 필요한 메모리를 줄여 봅니다.

- 작업 자체의 메모리 사용량이 매우 적다면 [쿼리 및 데이터 적재 이외의 프로세스 메모리 사용량이 너무 큰 경우]를 참고하여 프로세스 내 다른 부분의 메모리 사용량을 줄여 쿼리 및 기타 작업 실행에 사용할 메모리를 더 확보해 봅니다.

메모리 한도, 워터마크 계산 방법, 메모리 GC에 대한 자세한 내용은 [메모리 제어 전략](./../memory-feature/memory-control-strategy.md)을 참고하세요.

### 1 메모리 Full GC에서 취소된 경우 {#1-canceled-in-memory-full-gc}

BE 프로세스의 메모리 사용량이 프로세스 메모리 상한(MemLimit)을 초과하거나 시스템의 남은 가용 메모리가 메모리 하한 워터마크(LowWaterMark)보다 낮아지면 Full GC가 실행됩니다. 이때 메모리를 가장 많이 사용하는 작업이 먼저 취소됩니다.

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory used query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB. Execute again after enough memory, details see be.INFO.
```

오류 메시지 분석:

1. `(10.16.10.8)`: 쿼리 실행 중 메모리가 부족해진 BE 노드입니다.

2. `query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB`: 현재 취소된 쿼리의 queryID이며, 쿼리 자체는 866.97 MB의 메모리를 사용합니다.

3. `process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB` 프로세스 메모리가 한도를 초과한 이유는 BE 프로세스가 사용하는 물리 메모리인 3.12 GB가 MemLimit인 3.01 GB를 초과했기 때문입니다. 현재 운영 체제에서 BE가 사용할 수 있는 메모리는 191.25 GB로, LowWaterMark인 3.20 GB보다 여전히 높습니다.

### 2 메모리 Minor GC에서 취소된 경우 {#2-canceled-in-minor-gc-of-memory}

Doris BE 프로세스의 메모리 사용량이 프로세스 메모리 소프트 한도(SoftMemLimit)를 초과하거나 시스템의 남은 가용 메모리가 메모리 경고 워터마크(WarningWaterMark)보다 낮아지면 Minor GC가 실행됩니다. 이때 메모리 한도 대비 사용량 비율이 가장 높은 쿼리가 먼저 취소됩니다.

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory overcommit query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 2.12 GB exceed soft limit 2.71 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB. Execute again after enough memory, details see be.INFO.
```

오류 메시지 분석: `process memory used 3.12 GB exceed soft limit 6.02 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB` 프로세스 메모리가 한도를 초과한 이유는 현재 운영 체제에서 BE가 사용할 수 있는 남은 메모리가 3.25 GB로, WarningWaterMark인 6.40 GB보다 낮기 때문입니다. BE 프로세스가 사용하는 물리 메모리는 2.12 GB로, SoftMemLimit인 2.71 GB를 초과하지 않습니다.

### 3 Allocator에 메모리 할당을 요청했지만 실패한 경우 {#3-failed-to-apply-for-memory-from-allocator}

Doris BE에서 큰 메모리를 요청하면 `Doris Allocator`를 통해 할당되며, 할당 과정에서 메모리 크기를 확인합니다. 프로세스의 가용 메모리가 부족하면 예외가 발생하고 현재 쿼리의 취소를 시도합니다.

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator sys memory check failed: Cannot alloc:4294967296, consuming tracker:<Query#Id=457efb1fdae74d3 b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:<>, process memory used 2.23 GB exceed limit 3.01 GB or sys available memory 181.67 GB less than low water mark 3.20 GB.
```

오류 메시지 분석:

1. `consuming tracker:<Query#Id=457efb1fdae74d3b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:VAGGREGATION_NODE (id=7)>`: 현재 취소 중인 쿼리의 queryID입니다. 쿼리의 현재 메모리 사용량은 386704704 Bytes이고, 최대 메모리 사용량은 405956032 Bytes이며, 실행 중인 연산자는 `VAGGREGATION_NODE (id=7)>`입니다.

2. `Cannot alloc:4294967296`: 현재 프로세스의 메모리 사용량인 2.23 GB에 4 GB를 더하면 MemLimit인 3.01 GB를 초과하므로, 현재의 4 GB 메모리 할당 요청이 실패했습니다.

## 취소된 쿼리의 메모리 사용량이 너무 큰 경우 {#the-memory-usage-of-the-canceled-query-is-too-large}

[쿼리 메모리 분석](./query-memory-analysis.md) 또는 [데이터 적재 메모리 분석](./load-memory-analysis.md)을 참고하여 쿼리와 데이터 적재의 메모리 사용량을 분석하고, 매개변수를 조정하거나 SQL을 최적화하여 실행에 필요한 메모리를 줄여 봅니다.

Allocator에 메모리 할당을 요청했지만 실패하여 작업이 취소된 경우, `Cannot alloc` 또는 `try alloc`은 쿼리가 현재 요청하는 메모리가 너무 크다는 것을 보여 줍니다. 이때 해당 메모리 할당 요청이 적절한지 확인해야 합니다. `Allocator sys memory check failed`를 `be/log/be.INFO`에서 검색하면 메모리 할당 요청의 스택을 찾을 수 있습니다.

## 취소된 쿼리 자체의 메모리 사용량은 적지만 메모리를 더 많이 사용하는 다른 쿼리가 있는 경우 {#the-canceled-query-itself-has-a-small-memory-and-there-are-other-queries-with-larger-memory}

일반적으로 메모리를 더 많이 사용하는 쿼리가 취소 단계에서 멈춰 메모리를 제때 해제하지 못하기 때문입니다. Full GC는 먼저 메모리 사용량이 큰 쿼리부터 순서대로 취소한 다음, 메모리 사용량이 큰 데이터 적재 작업부터 순서대로 취소합니다. 메모리 Full GC에서 쿼리가 취소되었는데 BE 프로세스에 현재 취소된 쿼리보다 메모리를 더 많이 사용하는 다른 쿼리가 있다면, 이러한 쿼리가 취소 과정에서 멈췄는지 확인해야 합니다.

먼저 `grep {queryID} be/log/be.INFO`를 실행하여 쿼리가 취소된 시점을 찾은 다음, 전후 로그에서 `Memory Tracker Summary`를 검색하여 프로세스 메모리 통계 로그를 찾습니다. `Memory Tracker Summary`에 메모리를 더 많이 사용하는 쿼리가 있다면 `grep {queryID with larger memory} be/log/be.INFO`를 실행하여 `Cancel` 키워드가 포함된 로그가 있는지 확인합니다. 해당 로그의 시점이 쿼리가 취소된 시점입니다. 해당 쿼리도 취소되었으며 메모리를 더 많이 사용하는 쿼리의 취소 시점이 현재 쿼리의 취소 시점과 다르다면, [메모리 문제 FAQ](../../../trouble-shooting/memory-management/memory-issue-faq)의 [쿼리 취소 과정이 멈추는 경우]를 참고하여 메모리를 더 많이 사용하는 쿼리가 캐시 처리 과정에서 멈췄는지 분석합니다. `Memory Tracker Summary`의 분석 방법은 [메모리 로그 분석](./memory-log-analysis.md)을 참고하세요.

## 쿼리 및 데이터 적재 작업 이외의 프로세스 메모리 사용량이 너무 큰 경우 {#process-memory-outside-query-and-load-tasks-is-too-large}

메모리가 사용되는 위치를 파악하고 메모리 사용량을 줄여 쿼리와 데이터 적재 실행에 사용할 메모리를 더 확보하는 방안을 검토합니다.

가용 메모리 부족으로 작업이 취소된 시점은 `be/log/be.INFO`의 프로세스 메모리 통계 로그에서 확인할 수 있습니다. `grep queryID be/log/be.INFO`를 실행하여 쿼리가 취소된 시점을 찾은 다음, 전후 로그에서 `Memory Tracker Summary`를 검색하여 프로세스 메모리 통계 로그를 찾습니다. 그런 다음 [메모리 로그 분석](./memory-log-analysis.md)의 [프로세스 메모리 통계 로그 분석] 절을 참고하여 추가로 분석합니다. 분석하기 전에 [Memory Tracker](./../memory-feature/memory-tracker.md)의 [Memory Tracker 통계 누락] 절을 참고하여 Memory Tracker에 누락된 통계가 있는지 분석합니다.

Memory Tracker에 누락된 통계가 있다면 [Memory Tracker 통계 누락] 절을 참고하여 추가로 분석합니다. 그렇지 않다면 Memory Tracker가 메모리의 대부분을 집계하고 있으며 누락된 통계가 없는 것입니다. [개요](./../overview.md)를 참고하여 Doris BE 프로세스의 각 부분이 메모리를 과도하게 사용하는 원인과 메모리 사용량을 줄이는 방법을 분석합니다.
