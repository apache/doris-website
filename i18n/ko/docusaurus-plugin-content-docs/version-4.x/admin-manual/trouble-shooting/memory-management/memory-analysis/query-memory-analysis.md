---
{
    "title": "쿼리 메모리 분석",
    "language": "ko",
    "description": "일반적으로 쿼리 메모리 사용량은 먼저 Query Profile로 분석합니다."
}
---

일반적으로 쿼리 메모리 사용량은 먼저 Query Profile로 분석합니다. Query Profile에서 집계한 각 Operator의 메모리 합계가 Query Memory Tracker에서 집계한 메모리보다 훨씬 작다면, Query Profile에 집계된 Operator 메모리와 실제 메모리 사용량 사이에 큰 차이가 있다는 뜻입니다. 이때는 대개 Heap Profile을 사용하여 추가로 분석해야 합니다. 메모리 제한 초과로 쿼리가 취소되어 완료되지 못하면 Query Profile이 불완전하므로 정확한 분석이 어려울 수 있습니다. 이런 경우에는 보통 Heap Profile을 직접 사용하여 쿼리 메모리 사용량을 분석합니다.

## 쿼리 메모리 보기 {#query-memory-view}

어디에서든 `Label=query, Type=overview` Memory Tracker의 값이 크게 나타나면 쿼리의 메모리 사용량이 높다는 뜻입니다.

```
MemTrackerLimiter Label=query, Type=overview, Limit=-1.00 B(-1 B), Used=83.32 MB(87369024 B), Peak=88.33 MB(92616000 B)
```

분석할 쿼리를 이미 알고 있다면 이 섹션을 건너뛰고 아래 분석을 계속 진행하세요. 그렇지 않다면 다음 방법으로 메모리를 많이 사용하는 쿼리를 찾으세요.

먼저 메모리를 많이 사용하는 쿼리의 QueryID를 찾습니다. BE 웹 페이지 `http://{be_host}:{be_web_server_port}/mem_tracker?type=query`에서 `Current Consumption`을 기준으로 정렬하면 메모리를 많이 사용하는 쿼리를 실시간으로 확인할 수 있습니다. QueryID는 `label`에서 찾을 수 있습니다.

프로세스 메모리가 제한을 초과하거나 사용 가능한 메모리가 부족하다는 오류가 발생하면, `Memory Tracker Summary`가 `be.INFO` 로그에 기록되며, 그 하단에는 메모리 사용량이 가장 높은 작업(쿼리/데이터 적재/compaction 등) 10개의 Memory Tracker가 포함됩니다. 형식은 `MemTrackerLimiter Label=Query#Id=xxx, Type=query`입니다. 일반적으로 메모리를 많이 사용하는 쿼리의 QueryID는 상위 10개 작업에서 찾을 수 있습니다.

과거 쿼리의 메모리 통계는 각 쿼리의 `peakMemoryBytes`에서 확인할 수 있으며, 이 값은 `fe/log/fe.audit.log`에 기록됩니다. 또는 `Deregister query/load memory tracker, queryId`를 `be/log/be.INFO`에서 검색하여 단일 BE에서 각 쿼리의 피크 메모리 사용량을 확인할 수 있습니다.

## Query Profile을 사용한 쿼리 메모리 사용량 분석 {#use-query-profile-to-analyze-query-memory-usage}

QueryID를 기준으로 `fe/log/fe.audit.log`에서 SQL을 비롯한 쿼리 정보를 찾고, `explain SQL`로 쿼리 실행 계획을 확인한 다음, `set enable_profile=true`를 설정하고 SQL을 실행하여 Query Profile을 얻습니다. Query Profile에 대한 자세한 소개는 [Query Profile](../../../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile-analyzing-execution-layer-bottlenecks) 문서를 참고하세요. 여기서는 Query Profile에서 메모리와 관련된 내용만 살펴보고, 이를 바탕으로 메모리를 많이 사용하는 Operator와 데이터 구조를 찾습니다.

1. 메모리를 많이 사용하는 Operator 또는 메모리 데이터 구조 찾기

Query Profile은 두 부분으로 나뉩니다.

- `MergedProfile`

MergedProfile은 쿼리의 모든 Instance Profile을 집계한 결과입니다. 모든 Instance에 걸쳐 각 Fragment의 각 Pipeline에 속한 각 Operator의 메모리 사용량에 대한 sum, avg, max, min을 보여 줍니다. 여기에는 Operator의 피크 메모리 사용량인 `PeakMemoryUsage`와 `HashTable`, `Arena` 등 주요 메모리 데이터 구조의 피크 메모리 사용량이 포함됩니다. 이를 바탕으로 메모리를 많이 사용하는 Operator와 데이터 구조를 찾을 수 있습니다.

```
MergedProfile  
          Fragments:
              Fragment  0:
                  Pipeline  :  0(instance_num=1):
                      RESULT_SINK_OPERATOR  (id=0):
                            -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                          EXCHANGE_OPERATOR  (id=20):
                                -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                    -  PeakMemoryUsage:  sum  1.16  KB,  avg  1.16  KB,  max  1.16  KB,  min  1.16  KB
              Fragment  1:
                  Pipeline  :  1(instance_num=12):
                      AGGREGATION_SINK_OPERATOR  (id=18  ,  nereids_id=1532):
                            -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                -  HashTable:  sum  96.00  B,  avg  8.00  B,  max  24.00  B,  min  0.00  
                                -  PeakMemoryUsage:  sum  1.58  MB,  avg  134.67  KB,  max  404.02  KB,  min  0.00  
                                -  SerializeKeyArena:  sum  1.58  MB,  avg  134.67  KB,  max  404.00  KB,  min  0.00  
                          EXCHANGE_OPERATOR  (id=17):
                                -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                    -  PeakMemoryUsage:  sum  2.25  KB,  avg  192.00  B,  max  768.00  B,  min  0.00
```

- `Execution  Profile`

`Execution Profile`은 쿼리의 개별 Instance Profile 결과입니다. 일반적으로 `MergedProfile`을 바탕으로 메모리를 많이 사용하는 Operator와 데이터 구조를 찾은 뒤, `explain SQL`로 얻은 쿼리 실행 계획을 바탕으로 메모리 사용 원인을 분석할 수 있습니다. 특정 BE 노드나 특정 Instance에서 쿼리의 메모리 사용량을 분석해야 하는 경우에는 `Execution Profile`을 바탕으로 해당 대상을 더 구체적으로 찾을 수 있습니다.

```
Execution  Profile  36ca4f8b97834449-acae910fbee8c670:(ExecTime:  48sec201ms)
    Fragments:
        Fragment  0:
            Fragment  Level  Profile:    (host=TNetworkAddress(hostname:10.16.10.8,  port:9013)):(ExecTime:  48sec111ms)
            Pipeline  :1    (host=TNetworkAddress(hostname:10.16.10.8,  port:9013)):
                PipelineTask  (index=80):(ExecTime:  6sec267ms)
                DATA_STREAM_SINK_OPERATOR  (id=17,dst_id=17):(ExecTime:  1.634ms)
                -  MemoryUsage:  
                    -  PeakMemoryUsage:  1.50  KB
                STREAMING_AGGREGATION_OPERATOR  (id=16  ,  nereids_id=1526):(ExecTime:  41.269ms)
                    -  MemoryUsage:  
                        -  HashTable:  168.00  B
                        -  PeakMemoryUsage:  404.16  KB
                        -  SerializeKeyArena:  404.00  KB
                HASH_JOIN_OPERATOR  (id=15  ,  nereids_id=1520):(ExecTime:  6sec150ms)
                        -  MemoryUsage:  
                            -  PeakMemoryUsage:  3.22  KB
                            -  ProbeKeyArena:  3.22  KB
                    LOCAL_EXCHANGE_OPERATOR  (PASSTHROUGH)  (id=-12):(ExecTime:  67.950ms)
                            -  MemoryUsage:  
                                -  PeakMemoryUsage:  1.41  MB
```

2. `HASH_JOIN_SINK_OPERATOR`가 메모리를 너무 많이 사용하는 경우

```
HASH_JOIN_SINK_OPERATOR  (id=12  ,  nereids_id=1304):(ExecTime:  1min14sec)
    -  JoinType:  INNER_JOIN
    -  BroadcastJoin:  true
    -  BuildRows:  600.030257M  (600030257)
    -  InputRows:  600.030256M  (600030256)
    -  MemoryUsage:  
        -  BuildBlocks:  15.65  GB
        -  BuildKeyArena:  0.00  
        -  HashTable:  6.24  GB
        -  PeakMemoryUsage:  21.89 GB
```

Hash Join Build 단계에서는 주로 `BuildBlocks`와 `HashTable`이 메모리를 사용한다는 것을 알 수 있습니다. 일반적으로 Hash Join Build 단계에서 메모리를 너무 많이 사용한다면, 먼저 Join Reorder 순서가 적절한지 확인합니다. 일반적으로 작은 테이블을 Hash Join Build에 사용하고 큰 테이블을 Hash Join Probe에 사용하는 것이 올바른 순서입니다. 이렇게 하면 Hash Join의 전체 메모리 사용량을 최소화할 수 있으며, 대개 성능도 더 좋습니다.

Join Reorder 순서가 적절한지 확인하기 위해 `HASH_JOIN_OPERATOR`의 Profile 중 id=12인 것을 찾습니다. `ProbeRows`는 196240행에 불과합니다. 따라서 이 Hash Join의 올바른 Join Reorder 순서는 왼쪽 테이블과 오른쪽 테이블의 위치를 바꾸는 것입니다. `set disable_join_reorder=true`로 Join Reorder를 끈 뒤 왼쪽과 오른쪽 테이블의 순서를 수동으로 지정하고 쿼리를 검증할 수 있습니다. 자세한 내용은 쿼리 옵티마이저의 Join Reorder 관련 문서를 참고하세요.

```
HASH_JOIN_OPERATOR  (id=12  ,  nereids_id=1304):(ExecTime:  8sec223ms)
    -  BlocksProduced:  227
    -  MemoryUsage:  
        -  PeakMemoryUsage:  0.00  
        -  ProbeKeyArena:  0.00  
    -  ProbeRows:  196.24K  (196240)
    -  RowsProduced:  786.22K  (786220)
```

## Heap Profile을 사용한 쿼리 메모리 사용량 분석 {#use-heap-profile-to-analyze-query-memory-usage}

위의 Query Profile로 메모리를 사용하는 위치를 정확하게 찾을 수 없고, 클러스터를 쉽게 재시작하여 현상을 재현할 수 있다면 [Heap Profile 메모리 분석](./heap-profile-memory-analysis.md)을 참고하여 쿼리 메모리를 분석하세요.

쿼리 실행 전에 Heap Profile을 한 번 덤프하고, 쿼리 실행 중에 다시 한 번 덤프합니다. `jeprof --dot lib/doris_be --base=heap_dump_file_1 heap_dump_file_2`를 사용하여 두 Heap Profile 사이의 메모리 변화를 비교하면 쿼리 실행 중 코드의 각 함수가 차지하는 메모리 사용 비율을 확인할 수 있습니다. 코드를 대조하여 메모리를 사용하는 위치를 찾습니다. 쿼리 실행 중에는 메모리가 실시간으로 변하므로, 실행 중에 Heap Profile을 여러 번 덤프하여 비교하고 분석해야 할 수 있습니다.
