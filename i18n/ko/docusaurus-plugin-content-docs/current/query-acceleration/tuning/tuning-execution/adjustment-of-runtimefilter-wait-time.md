---
{
    "title": "RuntimeFilter 대기 시간 튜닝: NOT_READY와 느린 쿼리 해결",
    "sidebar_label": "RuntimeFilter 튜닝",
    "language": "ko",
    "description": "RuntimeFilter 대기 시간 제한이 적용되지 않아 쿼리가 느려지나요? 이 문서에서는 Profile을 사용해 NOT_READY 상태를 찾아내고 runtime_filter_wait_time_ms를 조정하는 방법을 설명합니다.",
    "keywords": ["Doris RuntimeFilter", "runtime_filter_wait_time_ms", "RuntimeFilterState NOT_READY", "WaitForRuntimeFilter", "쿼리 튜닝"]
}
---

<!-- Knowledge type: Tuning guide -->
<!-- Applicable scenario: Query performance issues caused by unreasonable (too short / too long) RuntimeFilter wait time -->

**RuntimeFilter**는 쿼리 최적화 기법입니다. 실행 중에 Join의 오른쪽 테이블에서 필터 조건을 생성하고 이를 왼쪽 테이블의 스캔 단계로 푸시다운하여 I/O와 연산량을 줄입니다.

RuntimeFilter 대기 시간을 적절하지 않게(너무 짧게) 설정하면 필터가 생성되기 전에 왼쪽 테이블 스캔이 시작되어 최적화가 적용되지 않고 쿼리가 느려질 수 있습니다.

이 문서에서는 실제 Profile 사례를 통해 이 문제를 진단하고 해결하는 방법을 설명합니다.

## 적용 조건 체크리스트 {#applicability-checklist}

<!-- Knowledge type: Prerequisites -->
<!-- Applicable scenario: Determine whether RuntimeFilter wait time needs to be adjusted -->

대기 시간을 조정하기 전에 다음 사항을 확인하세요.

- 쿼리 실행이 느리고 Join 연산이 포함되어 있습니다.
- `EXPLAIN` / `PROFILE`을 통해 실행 계획과 실행 Profile을 확보했습니다.
- Profile에 `WaitForRuntimeFilter` 필드가 있습니다.
- RuntimeFilter 상태가 `NOT_READY`이거나 Join 빌드 시간이 현재 대기 시간보다 깁니다.

## 주요 매개변수 {#key-parameters}

<!-- Knowledge type: Parameter configuration -->
<!-- Applicable scenario: Adjust RuntimeFilter wait time -->

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `runtime_filter_wait_time_ms` | 1000 ms | 왼쪽 테이블 스캔이 RuntimeFilter가 생성되기를 기다리는 최대 시간입니다. 이 시간이 지나면 대기를 중단하고 바로 스캔합니다. |

설정 방법(Session 수준):

```sql
SET runtime_filter_wait_time_ms = 3000;
```

## 사례: 대기 시간이 너무 짧아 RuntimeFilter가 준비되지 않는 경우 {#case-wait-time-too-short-causes-runtimefilter-not-ready}

<!-- Knowledge type: Case analysis -->
<!-- Applicable scenario: Diagnose RuntimeFilter NOT_READY issues through Profile -->

### 1단계: ScanOperator에서 대기 상태 확인 {#step-1-observe-the-wait-state-from-scanoperator}

다음 Profile 정보를 참고하세요.

```sql
OLAP_SCAN_OPERATOR (id=22. nereids_id=1764. table name = test_doris(test_doris)):(ExecTime: 62.870ms)
               - RuntimeFilters: : RuntimeFilter: (id = 6, type = minmax, need_local_merge: true, is_broadcast: false, build_bf_cardinality: false, RuntimeFilter: (id = 7, type = in_or_bloomfilter, need_local_merge: true, is_broadcast: false, build_bf_cardinality: false,
               - PushDownPredicates: []
               - KeyRanges: ScanKeys:ScanKey=[null(-9223372036854775808) : 9223372036854775807]
               - TabletIds: [1732763414173, 1732763414187, 1732763414201, 1732763414215]
               - UseSpecificThreadToken: False
               - AcquireRuntimeFilterTime: 969ns
               - BlocksProduced: 1.829K (1829)
               - CloseTime: 0ns
               - ExecTime: 62.870ms
               - InitTime: 75.703us
               - KeyRangesNum: 0
               - MaxScannerThreadNum: 32
               - MemoryUsage:
                 - PeakMemoryUsage: 0.00
               - NumScanners: 32
               - OpenTime: 19.276ms
               - ProcessConjunctTime: 30.360us
               - ProjectionTime: 0ns
               - RowsProduced: 7.433056M (7433056)
               - RowsRead: 0
               - RuntimeFilterInfo:
               - ScannerWorkerWaitTime: 0ns
               - TabletNum: 4
               - TotalReadThroughput: 0
               - WaitForDependency[OLAP_SCAN_OPERATOR_DEPENDENCY]Time: 0ns
               - WaitForRuntimeFilter: 1000ms
              RuntimeFilter: (id = 6, type = minmax):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
              RuntimeFilter: (id = 7, type = in_or_bloomfilter):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
```

핵심 지표:

- `WaitForRuntimeFilter: 1000ms`: 스캔 연산자가 1000ms 동안 대기했습니다.
- `RuntimeFilterState = NOT_READY`: RuntimeFilter 6과 7은 아직 준비되지 않았습니다.
- `IsPushDown = false`: 필터를 스캔 단계로 푸시다운하지 못했습니다.

### 2단계: RuntimeFilter를 생성하는 Join 찾기 {#step-2-locate-the-join-that-generates-the-runtimefilters}

```sql
RuntimeFilter: (id = 6, type = minmax):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
RuntimeFilter: (id = 7, type = in_or_bloomfilter):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
```

Profile에서 RuntimeFilter 6과 7을 생성하는 Join 연산자를 찾습니다.

```sql
HASH_JOIN_OPERATOR (id=26 , nereids_id=37948):
                - PlanInfo
                   - join op: RIGHT OUTER JOIN(PARTITIONED)[]
                   - equal join conjunct: (id = ID)
                   - runtime filters: RF006[min_max] <- ID(6418/8192/1048576), RF007[in_or_bloom] <- ID(6418/8192/1048576)
                   - cardinality=6,418
                   - vec output tuple id: 27
                   - output tuple id: 27
                   - vIntermediate tuple ids: 25
                   - hash output slot ids: 396 398 399 400 401 402 403 404 405 406 407 408 409 410 411 412 413 447
                   - projections: USER_ID
                   - project output tuple id: 27
                - BlocksProduced: sum 1, avg 1, max 1, min 1
                - CloseTime: avg 10.111us, max 10.111us, min 10.111us
                - ExecTime: avg 364.497us, max 364.497us, min 364.497us
                - InitTime: avg 26.653us, max 26.653us, min 26.653us
                - MemoryUsage: sum , avg , max , min
                  - PeakMemoryUsage: sum 0.00 , avg 0.00 , max 0.00 , min 0.00
                  - ProbeKeyArena: sum 0.00 , avg 0.00 , max 0.00 , min 0.00
                - OpenTime: avg 45.985us, max 45.985us, min 45.985us
                - ProbeRows: sum 0, avg 0, max 0, min 0
                - ProjectionTime: avg 211.930us, max 211.930us, min 211.930us
                - RowsProduced: sum 1, avg 1, max 1, min 1
                - WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 1sec780ms, max 1sec780ms, min 1sec780ms
```

`WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: 1sec780ms`는 Join 빌드에 약 **1.78s**가 걸렸음을 나타내며, 이는 RuntimeFilter의 기본 대기 시간인 1s를 초과합니다. 따라서 ScanOperator가 필터가 준비될 때까지 기다리지 못합니다.

### 3단계: 대기 시간 늘리기 {#step-3-increase-the-wait-time}

- **목표**: 스캔 연산자가 RuntimeFilter가 생성될 때까지 기다리도록 하여 푸시다운이 수행되게 합니다.
- **명령**:

  ```sql
  SET runtime_filter_wait_time_ms = 3000;
  ```

- **설명**: 대기 시간 상한을 1000ms에서 3000ms로 늘려 Join 빌드 시간인 1.78s를 충분히 기다릴 수 있도록 합니다.

### 4단계: 효과 확인 {#step-4-verify-the-effect}

조정 후 쿼리 실행 시간이 **5s에서 2s로** 줄었습니다.

## 진단 절차 비교 {#diagnostic-workflow-comparison}

<!-- Knowledge type: Method comparison -->
<!-- Applicable scenario: Quickly select a diagnostic path -->

| 증상 | 가능한 원인 | 권장 조치 |
| --- | --- | --- |
| `RuntimeFilterState = NOT_READY`이고 `WaitForRuntimeFilter`가 제한값에 근접함 | 대기 시간이 너무 짧거나 Join 빌드가 느림 | `runtime_filter_wait_time_ms`를 늘립니다 |
| `RuntimeFilterState = READY`이고 `IsPushDown = true`임 | 필터가 적용됨 | 조정할 필요 없음 |
| `Ignored = true` | 필터의 선택도가 낮아 자동으로 무시됨 | Join의 선택도를 확인하고 강제로 활성화하지 않습니다 |
| 스캔 단계가 오랫동안 유휴 상태에 머무름 | 대기 시간이 너무 길고 필터의 효과가 낮음 | `runtime_filter_wait_time_ms`를 적절히 줄입니다 |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Troubleshoot RuntimeFilter-related questions -->

**Q1: `runtime_filter_wait_time_ms`는 클수록 좋은가요?**

아닙니다. 대기 시간이 너무 길면 왼쪽 테이블 스캔이 오랫동안 유휴 상태에 머물러 오히려 쿼리가 느려집니다. Join 빌드 시간(`WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time`)을 기준으로 값을 적절히 늘리는 것이 좋습니다.

**Q2: RuntimeFilter가 실제로 적용되었는지 어떻게 확인하나요?**

Profile에서 RuntimeFilter의 `RuntimeFilterState` 및 `IsPushDown` 필드를 확인합니다. `READY`와 `IsPushDown = true`이면 필터가 적용된 상태입니다.

**Q3: 조정 후에도 여전히 NOT_READY라면 어떻게 해야 하나요?**

Join의 오른쪽 테이블에 데이터 스큐나 느린 Shuffle과 같은 더 근본적인 병목이 있는지 확인하거나, SQL Hint를 사용해 이 쿼리에 효과가 없는 RuntimeFilter를 비활성화하는 방법을 고려합니다.

**Q4: 이 매개변수를 전역으로 설정할 수 있나요?**

가능합니다. 다만 다른 쿼리에 전역적으로 영향을 주지 않도록 Session 수준에서 조정하거나 Hint를 통해 단일 SQL에만 적용하는 것이 좋습니다.

## 요약 {#summary}

<!-- Knowledge type: Key takeaways -->
<!-- Applicable scenario: Practical recap -->

- RuntimeFilter 대기 시간은 Join 빌드 시간을 고려하여 설정해야 합니다. 모든 상황에 맞는 값은 없습니다.
- `EXPLAIN`과 `PROFILE`을 사용하여 `NOT_READY` 상태와 Join 시간을 파악합니다.
- `SET runtime_filter_wait_time_ms` 또는 SQL Hint를 사용하여 대기 시간을 조정합니다.
- Doris는 적응형 최적화를 지속적으로 발전시키고 있으며, 앞으로 이 매개변수에 대한 수동 조정의 필요성은 점차 줄어들 것입니다.
