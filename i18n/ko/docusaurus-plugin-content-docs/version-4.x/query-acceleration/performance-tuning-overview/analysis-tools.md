---
{
    "title": "느린 SQL 분석 도구: Explain과 Profile",
    "language": "ko",
    "description": "Doris에서 느린 SQL의 성능 병목을 어떻게 분석할 수 있을까요? 이 문서에서는 Explain, Profile, 시스템 수준 도구를 사용하여 계획 계층과 실행 계층의 문제를 빠르게 찾는 방법을 소개합니다.",
    "keywords": ["Doris 성능 분석", "Doris Explain", "Doris Profile", "느린 SQL 분석", "Merged Profile", "Execution Profile", "PipelineTask"]
}
---

<!-- Knowledge type: concept + tool usage guide -->
<!-- Applicable scenario: After a slow SQL has been located, further analysis is needed to determine whether the bottleneck lies in the plan layer, execution layer, or system layer -->

성능 분석 도구는 느린 SQL을 찾은 후 성능 병목이 어디에 있는지 구체적으로 파악하는 데 사용합니다. 이전 절인 [진단 도구](diagnostic-tools.md)에서는 업무 담당자와 운영 담당자가 느린 SQL을 찾는 방법을 설명했습니다. 이 장에서는 이렇게 찾은 느린 SQL의 성능 병목을 분석하는 방법을 소개합니다.

**시작 전 확인 사항**: 분석을 시작하기 전에 다음 사항을 확인하세요.

- 진단 도구를 통해 분석할 느린 SQL을 찾았습니다.
- Doris FE에 접근할 수 있으며 `EXPLAIN`을 실행할 권한이 있습니다.
- 해당 SQL의 Profile을 가져올 수 있습니다(Profile 수집이 활성화되어 있습니다).
- BE 노드에 접근하여 시스템 수준의 성능 지표(CPU/메모리/IO/네트워크)를 확인할 수 있습니다.

### SQL 실행의 두 단계와 세 가지 병목 유형 {#two-stages-of-sql-execution-and-three-types-of-bottlenecks}

SQL 문 실행은 두 단계로 나뉩니다.

1. **계획 생성 단계**: 실행 계획을 생성합니다.
2. **계획 실행 단계**: 생성된 계획을 실행합니다.

어느 단계에서든 문제가 발생하면 성능 병목으로 이어질 수 있습니다.

- **비효율적인 계획**: 실행기가 아무리 뛰어나도 좋은 성능을 내기 어렵습니다.
- **부적절한 실행 방식**: 계획이 올바르더라도 병목이 발생하기 쉽습니다.
- **인프라 결함 또는 설정 오류**: 실행기 성능은 하드웨어 및 시스템 아키텍처와 밀접하게 연결되어 있습니다.

### 도구와 병목 유형의 대응 관계 {#mapping-between-tools-and-bottleneck-types}

| 병목 유형     | 권장 분석 도구 | 주요 용도                                            |
| ------------------- | ------------------------- | ------------------------------------------------------- |
| 계획 계층 병목 | Doris Explain           | SQL 실행 계획을 확인하고 계획 생성 문제 파악 |
| 실행 계층 병목 | Doris Profile      | 연산자별 상세 런타임 실행 정보 확인 |
| 시스템 수준 병목 | top/free/perf/sar 등 | 시스템 CPU/메모리/IO/네트워크의 실행 상태 관찰 |

다음 절에서는 이 세 가지 유형의 도구를 소개합니다.

## Doris Explain: 계획 계층 병목 분석 {#doris-explain-analyzing-plan-layer-bottlenecks}

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: When a slow SQL is suspected to be caused by a suboptimal plan, and the execution plan details need to be examined -->

### 한 문장으로 보는 정의 {#one-sentence-definition}

실행 계획은 SQL 문이 실행되는 구체적인 방식과 과정을 설명합니다. 예를 들어 두 테이블을 조인하는 SQL 문의 실행 계획에는 두 테이블의 접근 방식, 조인 방식, 조인 순서가 표시됩니다.

### 용도 {#purpose}

Doris Explain 도구는 SQL 실행 계획의 상세 정보를 편리하게 보여 줍니다. Explain 출력을 분석하면 계획 계층의 병목을 빠르게 찾고 상황에 맞게 계획을 튜닝할 수 있습니다.

### Explain 유형 비교 {#comparison-of-explain-types}

Doris는 다양한 분석 상황에 맞춰 여러 상세 수준의 Explain을 제공합니다.

| Explain 유형         | 출력 내용                       | 활용 상황                  |
| -------------------- | ------------------------------------ | ------------------------------------ |
| Explain Verbose      | 최종 물리 계획                  | BE에 전달되는 실제 물리 계획 확인 |
| Explain All Plan     | 단계별 논리 계획          | 논리 계획의 변환 과정 추적 |
| Explain Memo Plan    | 비용 기반 최적화 과정의 계획 | CBO 옵티마이저의 의사 결정 분석 |
| Explain Shape Plan   | 계획 형태                           | 계획의 골격과 구조를 빠르게 확인 |

각 Explain 유형의 구체적인 사용법과 출력 설명은 실행 계획 Explain 문서를 참고하세요.

### 대표적인 계획 계층 병목 {#typical-plan-layer-bottlenecks}

Explain 출력을 분석하면 다음과 같은 일반적인 계획 계층 병목을 빠르게 찾을 수 있습니다.

- **필터가 기본 테이블로 푸시다운되지 않음**: 데이터를 미리 필터링하지 않아 연산에 참여하는 데이터가 지나치게 많아집니다.
- **조인 조건이 반대쪽으로 유도되지 않음**: 두 테이블의 내부 동등 조인에서 한쪽의 필터 조건이 반대쪽으로 유도되지 않아 반대쪽 테이블의 데이터가 미리 필터링되지 않습니다.

Doris Explain을 사용한 계획 계층 튜닝 사례는 [계획 튜닝](../tuning/tuning-plan/optimizing-table-schema.md) 장을 참고하세요.

## Doris Profile: 실행 계층 병목 분석 {#doris-profile-analyzing-execution-layer-bottlenecks}

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: The plan has no obvious issues, but the SQL executes slowly, and the runtime time consumption of each operator needs to be examined -->

### 한 문장으로 보는 정의 {#one-sentence-definition-1}

Profile은 SQL이 실제로 실행되는 동안 각 연산자의 상세 소요 시간과 런타임 지표를 기록한 것으로, 실행 계층의 성능 병목을 찾는 데 사용합니다.

### Explain과의 차이 {#difference-from-explain}

Explain은 SQL 실행의 **계획**을 설명합니다. 예를 들어 t1과 t2의 조인을 Hash Join으로 계획하고, t1을 build 측에, t2를 probe 측에 배치합니다. Profile은 SQL 실행의 **실제 과정**을 설명합니다. 예를 들어 build와 probe에 각각 얼마나 걸렸는지 보여 줍니다.

### Profile 파일 구조 {#profile-file-structure}

Profile 파일은 다음과 같은 주요 부분으로 구성됩니다.

1. **쿼리 기본 정보**: ID, 시간, 데이터베이스 등입니다.
2. **SQL 문과 실행 계획**.
3. **FE 소요 시간**: Plan Time, Schedule Time 등입니다.
4. **BE 연산자별 실행 소요 시간**: Merged Profile과 Execution Profile이 포함됩니다.

실행 측의 상세 정보는 주로 마지막 부분에 있습니다. 다음 절에서는 Profile이 제공하는 실행 정보를 중점적으로 살펴봅니다.

### Merged Profile {#merged-profile}

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: Quickly view the aggregated performance metrics of an operator across all concurrent instances -->

Merged Profile은 모든 동시 실행 인스턴스에 걸쳐 집계한 각 연산자의 핵심 지표를 제공하므로 병목을 빠르게 찾기 쉽습니다. Doris에서는 사용자가 설정한 동시 실행 수준에 따라 각 연산자가 동시에 실행되며, Merged Profile은 각 지표의 Max, Avg, Min 값을 계산합니다.

**예시**(EXCHANGE_OPERATOR 사용):

```sql
EXCHANGE_OPERATOR  (id=4):
    -  BlocksProduced:  sum  0,  avg  0,  max  0,  min  0
    -  CloseTime:  avg  34.133us,  max  38.287us,  min  29.979us
    -  ExecTime:  avg  700.357us,  max  706.351us,  min  694.364us
    -  InitTime:  avg  648.104us,  max  648.604us,  min  647.605us
    -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
    -  PeakMemoryUsage:  sum  0.00  ,  avg  0.00  ,  max  0.00  ,  min  0.00  
    -  OpenTime:  avg  4.541us,  max  5.943us,  min  3.139us
    -  ProjectionTime:  avg  0ns,  max  0ns,  min  0ns
    -  RowsProduced:  sum  0,  avg  0,  max  0,  min  0
    -  WaitForDependencyTime:  avg  0ns,  max  0ns,  min  0ns
    -  WaitForData0:  avg  9.434ms,  max  9.476ms,  min  9.391ms
```

**핵심 지표 설명**:

| 지표 이름           | 지표 의미                                              |
| --------------------- | ----------------------------------------------------------- |
| BlocksProduced        | 생성한 Data Block 수                              |
| CloseTime             | 연산자의 close 단계 소요 시간               |
| ExecTime              | 연산자의 모든 단계에 걸친 총 실행 시간      |
| InitTime              | 연산자의 Init 단계 소요 시간                |
| MemoryUsage           | 실행 단계에서 연산자가 사용하는 메모리     |
| OpenTime              | 연산자의 Open 단계 소요 시간                |
| ProjectionTime        | 연산자의 프로젝션 소요 시간                    |
| RowsProduced          | 연산자가 반환한 행 수                     |
| WaitForDependencyTime | 연산자가 자신의 실행 의존성을 기다리는 시간   |

`WaitForDependencyTime`은 연산자마다 의미가 다릅니다. 예를 들어 위의 EXCHANGE_OPERATOR는 상위 연산자가 RPC로 전송하는 데이터에 의존하므로, 이 지표는 실제로 상위 연산자가 데이터를 보내기를 기다리는 시간을 측정합니다.

### Execution Profile {#execution-profile}

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: Locate fine-grained performance issues in a specific concurrent instance, or view operator-specialized metrics -->

Execution Profile은 특정 동시 실행 인스턴스의 상세 지표를 보여 줍니다. Merged Profile보다 더 세분화된 정보를 제공하며 연산자별 전용 지표도 포함합니다.

**예시**(id=4인 EXCHANGE_OPERATOR 사용):

```sql
EXCHANGE_OPERATOR  (id=4):(ExecTime:  706.351us)
      -  BlocksProduced:  0
      -  CloseTime:  38.287us
      -  DataArrivalWaitTime:  0ns
      -  DecompressBytes:  0.00  
      -  DecompressTime:  0ns
      -  DeserializeRowBatchTimer:  0ns
      -  ExecTime:  706.351us
      -  FirstBatchArrivalWaitTime:  0ns
      -  InitTime:  647.605us
      -  LocalBytesReceived:  0.00  
      -  MemoryUsage:  
      -  PeakMemoryUsage:  0.00  
      -  OpenTime:  5.943us
      -  ProjectionTime:  0ns
      -  RemoteBytesReceived:  0.00  
      -  RowsProduced:  0
      -  SendersBlockedTotalTimer(*):  0ns
      -  WaitForDependencyTime:  0ns
      -  WaitForData0:  9.476ms
```

예를 들어 `LocalBytesReceived`는 다른 연산자에는 없는 EXCHANGE_OPERATOR 전용 지표이므로 Merged Profile에는 포함되지 않습니다.

### PipelineTask 실행 시간 {#pipelinetask-execution-time}

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: Analyze the time distribution of a single PipelineTask, distinguishing actual execution, waiting for a Worker, and waiting for dependencies -->

Doris에서 PipelineTask는 여러 연산자로 구성됩니다. PipelineTask의 실행 시간을 분석할 때는 다음 세 가지 항목에 주목하세요.

| 주요 항목              | 설명                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| ExecuteTime             | PipelineTask의 실제 실행 시간으로, 태스크에 포함된 모든 연산자의 ExecTime 합계와 거의 같음 |
| WaitWorkerTime          | 태스크가 실행 Worker를 기다리는 시간으로, 주로 클러스터 부하에 따라 결정됨       |
| 실행 의존성 대기 시간 | 모든 연산자의 의존성 대기 시간 합계(모든 의존성이 충족되어야 태스크를 실행할 수 있음) |

**간단한 예시**:

```sql
PipelineTask  (index=1):(ExecTime:  4.773ms)
  -  ExecuteTime:  1.656ms
      -  CloseTime:  90.402us
      -  GetBlockTime:  11.235us
      -  OpenTime:  1.448ms
      -  PrepareTime:  1.555ms
      -  SinkTime:  14.228us
  -  WaitWorkerTime:  63.868us
    DATA_STREAM_SINK_OPERATOR  (id=8,dst_id=8):(ExecTime:  1.688ms)
      -  WaitForDependencyTime:  0ns
          -  WaitForBroadcastBuffer:  0ns
          -  WaitForRpcBufferQueue:  0ns
    AGGREGATION_OPERATOR  (id=7  ,  nereids_id=648):(ExecTime:  398.12us)
      -  WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time:  10.495ms
```

이 태스크에는 두 연산자(DATA_STREAM_SINK_OPERATOR와 AGGREGATION_OPERATOR)가 포함되어 있습니다. DATA_STREAM_SINK_OPERATOR에는 두 의존성(WaitForBroadcastBuffer와 WaitForRpcBufferQueue)이 있고, AGGREGATION_OPERATOR에는 하나의 의존성(AGGREGATION_OPERATOR_DEPENDENCY)이 있습니다. 이 태스크의 시간 분포는 다음과 같습니다.

| 시간 유형              | 값      | 설명                                                       |
| ---------------------- | ---------- | ----------------------------------------------------------------- |
| 총 실행 시간   | 1.656 ms   | 두 연산자의 ExecTime 합계와 거의 같음   |
| Worker 대기 시간 | 63.868 us | 현재 클러스터 부하가 높지 않아 태스크가 준비되는 즉시 Worker가 실행함 |
| 실행 의존성 대기 시간 | 10.495 ms | 모든 의존성 대기 시간의 합계와 같음          |

Profile을 사용한 실행 계층 튜닝 사례는 [실행 튜닝](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md) 장을 참고하세요.

## 시스템 수준 성능 도구 {#system-level-performance-tools}

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: When the performance bottleneck is suspected to be at the system layer (CPU/memory/IO/network), to assist in locating issues during execution -->

시스템 수준 도구는 시스템 리소스의 실행 상태를 관찰하여 SQL 실행 중 발생하는 성능 병목을 찾는 데 도움을 줍니다.

| 시스템 리소스 | 자주 사용하는 Linux 도구  | 주요 용도                                  |
| --------------- | ------------------- | --------------------------------------------- |
| CPU             | top, perf, sar      | CPU 사용률과 실행 시간이 집중되는 함수 관찰           |
| 메모리          | top, free, sar      | 메모리 사용량과 스왑 활동 관찰        |
| 디스크 IO         | iostat, sar         | 디스크 읽기/쓰기 속도와 대기 시간 관찰    |
| 네트워크         | sar, netstat        | 네트워크 트래픽과 연결 상태 관찰 |

## 자주 묻는 질문 {#frequently-asked-questions}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Common questions encountered when using analysis tools -->

### Q1: Explain, Profile, 시스템 도구 중 무엇을 먼저 사용해야 하나요? {#q1-among-explain-profile-and-system-tools-which-should-you-use-first}

우선순위가 높은 순서대로 살펴보세요. 먼저 **Explain**으로 계획에 문제가 없는지 확인합니다. 계획이 적절하다면 **Profile**로 느린 연산자를 찾습니다. 연산자 자체의 소요 시간은 적절하지만 전체 실행이 여전히 느리다면 **시스템 도구**를 확인합니다.

### Q2: Merged Profile과 Execution Profile 중 무엇을 선택해야 하나요? {#q2-should-you-choose-merged-profile-or-execution-profile}

먼저 **Merged Profile**로 연산자 간 소요 시간 차이를 빠르게 파악하세요. 특정 동시 실행 인스턴스에 이상이 있다고 의심되거나 연산자별 전용 지표를 확인해야 한다면 **Execution Profile**을 살펴보세요.

### Q3: PipelineTask가 전체적으로 느린데 ExecuteTime은 높지 않습니다. 이유가 무엇인가요? {#q3-the-pipelinetask-is-slow-overall-but-executetime-is-not-high-what-is-the-reason}

대개 **WaitWorkerTime이 길거나**(클러스터 부하가 높음) **의존성 대기 시간이 길기 때문입니다**(상위 연산자가 제때 데이터를 생성하지 못함). 의존성 이름을 바탕으로 상위 연산자의 병목을 찾아야 합니다.

### Q4: WaitForDependencyTime은 0인데 WaitForData0 값이 매우 높은 이유는 무엇인가요? {#q4-waitfordependencytime-is-0-but-waitfordata0-is-very-high}

`WaitForData0`는 EXCHANGE_OPERATOR가 상위 연산자의 RPC 데이터를 기다리는 구체적인 의존성에 해당합니다. 이 지표의 값이 높으면 일반적으로 상위 연산자의 데이터 생성이 느리다는 뜻이므로 상위 연산자를 추가로 조사해야 합니다.

## 요약 {#summary}

<!-- Knowledge type: summary -->

성능 분석 도구는 성능 병목을 빠르게 찾기 위한 중요한 전제 조건입니다.

- **Doris Explain**: 계획 계층의 병목을 찾습니다.
- **Doris Profile**: 실행 계층의 병목을 찾습니다(Merged Profile + Execution Profile + PipelineTask 시간).
- **시스템 수준 도구**: 하드웨어 및 운영체제 계층의 병목을 찾는 데 도움을 줍니다.

이 세 가지 유형의 도구를 능숙하게 조합하면 Doris의 느린 SQL에서 발생하는 성능 병목을 전 과정에 걸쳐 찾아 해결할 수 있습니다.
