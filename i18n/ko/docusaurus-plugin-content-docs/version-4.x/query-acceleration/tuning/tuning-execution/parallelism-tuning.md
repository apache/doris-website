---
{
    "title": "병렬도 튜닝: parallel_pipeline_task_num 설정 가이드",
    "sidebar_label": "병렬도 튜닝",
    "language": "ko",
    "description": "Doris 쿼리의 병렬도는 어떻게 튜닝할까요? 이 문서에서는 parallel_pipeline_task_num 설정 원칙, SQL/세션/전역 수준의 튜닝 방법, CPU 활용률 최적화 사례, 자주 묻는 질문을 설명합니다.",
    "keywords": ["Doris 병렬도 튜닝", "parallel_pipeline_task_num", "Doris CPU 활용률", "MPP 병렬 실행", "Pipeline 실행 엔진", "쿼리 성능 튜닝"],
}
---

<!-- Knowledge type: concept + operation -->
<!-- Applicable scenarios: query performance tuning, CPU resource utilization optimization, high-concurrency stress testing -->

Doris는 MPP 실행 프레임워크입니다. 모든 쿼리는 여러 BE에 걸쳐 병렬로 실행되며, 단일 BE 내부에서도 멀티스레드 병렬 처리를 통해 실행 속도를 더욱 높입니다. 모든 문(Query, DML, DDL)은 병렬 실행을 지원합니다.

**한 문장 정의**: `parallel_pipeline_task_num`은 단일 BE 내에서 단일 Fragment를 실행하는 데 사용하는 워커 태스크 수를 제어합니다.

### 빠른 진단 {#quick-diagnosis}

튜닝을 시작하기 전에 다음 사항을 확인하세요.

- `PROFILE` 도구로 쿼리가 CPU 병목인지 확인했나요?
- 현재 BE의 CPU 코어 수는 몇 개인가요?
- 포인트 쿼리, JOIN/집계, 부하 테스트, 복잡한 쿼리 중 어떤 유형인가요?
- Duplicate 또는 Unique Key Merge-On-Write 테이블 모델을 사용하나요?
- SQL, 세션, 전역 중 어느 수준에서 조정할 계획인가요?

> 기본값은 `0`이며, 이는 BE의 CPU 코어 수의 절반에 해당합니다. 이 기본값은 단일 쿼리와 동시 실행 시의 자원 활용을 이미 균형 있게 고려하므로, **일반적으로 사용자가 직접 조정할 필요가 없습니다**.

## 병렬도 튜닝 원칙 {#parallelism-tuning-principles}

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: scenario-based decision reference -->

`parallel_pipeline_task_num`의 목적은 멀티코어 자원을 충분히 활용하여 쿼리 지연 시간을 줄이는 것입니다. 하지만 멀티코어 병렬 처리에는 데이터 Shuffle 연산자와 스레드 간 동기화 로직이 추가되므로, 병렬도가 지나치게 높으면 자원이 낭비될 수 있습니다.

### 시나리오별 권장 병렬도 참고표 {#scenario-and-recommended-parallelism-reference-table}

> 아래 표는 BE의 CPU 코어 수가 16인 경우를 예로 듭니다.

| 쿼리 시나리오 | 일반적인 특성 | 권장 병렬도 | 근거 |
| --- | --- | --- | --- |
| 단일 테이블의 간단한 연산 | 단일 테이블 포인트 쿼리, 소량의 데이터를 스캔하는 `WHERE`, 소량의 데이터를 반환하는 `LIMIT`, 구체화된 뷰 적중 | **1** | Fragment가 하나뿐이며, 병목은 쿼리 실행 스레드가 아니라 데이터 스캔 스레드(적응형 병렬 처리)에 있음 |
| 두 테이블 JOIN / 집계 | 대용량 데이터, CPU 집약적 작업, CPU가 포화되지 않음 | **16** | Pipeline 실행 엔진의 병렬 처리 능력을 충분히 활용함. 무제한으로 높이지 말 것(예를 들어, 48로 설정하면 스케줄링 오버헤드만 증가함) |
| 동시 요청이 많은 부하 테스트 | 여러 쿼리의 동시 실행만으로도 CPU가 이미 포화될 수 있음 | **1** | 지나친 병렬 처리는 스레드 스케줄링과 프레임워크 스케줄링 오버헤드만 증가시킴 |
| 복잡한 쿼리 | 병목을 한 번에 파악하기 어려움 | **기본값** | Profile과 시스템 부하에 따라 유연하게 조정하고, 4-2-1 방식으로 단계적으로 낮춰 볼 것 |

> Doris는 적응형 전략을 지속적으로 개선하고 있습니다. 일반적으로 **특정 시나리오나 SQL 수준**에서만 조정하는 것을 권장합니다.

---

## 쿼리 병렬도 튜닝 방법 {#query-parallelism-tuning-methods}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: actual configuration -->

Doris는 SQL, 세션, 전역의 세 가지 수준에서 쿼리 병렬도를 직접 지정할 수 있습니다.

### 방법 1: SQL 수준(권장) {#method-1-sql-level-recommended}

-   **목적**: 단일 SQL 문에만 영향을 주므로 유연하고 정밀하게 제어할 수 있습니다.
-   **명령**: SQL HINT를 사용합니다.
-   **설명**: 다른 쿼리에 영향을 주지 않고 특정 SQL 문을 세밀하게 튜닝할 때 적합합니다.

```sql
SELECT /*+SET_VAR(parallel_pipeline_task_num=8)*/ *
FROM nation, lineitem
WHERE lineitem.l_suppkey = nation.n_nationkey;

SELECT /*+SET_VAR(parallel_pipeline_task_num=8,runtime_filter_mode=global)*/ *
FROM nation, lineitem
WHERE lineitem.l_suppkey = nation.n_nationkey;
```

### 방법 2: 세션 수준 {#method-2-session-level}

-   **목적**: 현재 세션의 모든 쿼리에 영향을 줍니다.
-   **명령**: 세션 변수로 설정합니다.
-   **설명**: 단일 행 쿼리를 포함하여 세션 내의 모든 SQL 문에 이 병렬도가 적용되므로, 일부 소규모 쿼리의 성능이 저하될 수 있습니다.

```sql
SET parallel_pipeline_task_num = 8;
```

### 방법 3: 전역 수준 {#method-3-global-level}

-   **목적**: 전체 클러스터의 기본 동작에 영향을 줍니다.
-   **명령**: `SET GLOBAL`을 사용합니다.
-   **설명**: 일반적으로 전역 CPU 활용률을 튜닝할 때 사용합니다. `global` 설정을 적용하면 현재 연결과 새로 생성되는 연결에 적용되지만, 다른 기존 연결에는 영향을 주지 않습니다. 모든 연결에 즉시 적용하려면 FE를 재시작하세요.

```sql
SET GLOBAL parallel_pipeline_task_num = 8;
```

### 세 가지 튜닝 방법 비교 {#comparison-of-the-three-tuning-methods}

| 튜닝 방법 | 적용 범위 | 적용 시점 | 권장 시나리오 |
| --- | --- | --- | --- |
| SQL HINT | 단일 SQL 문 | 즉시 | 단일 SQL의 세밀한 튜닝(**가장 안전함**) |
| 세션 | 현재 세션 | 즉시 | 서로 관련된 쿼리 그룹 튜닝 |
| 전역 | 전체 클러스터 | 새 연결에 적용 | 클러스터 수준의 CPU 활용률 최적화 |

---

## 데이터 샤딩과 병렬도 {#data-sharding-and-parallelism}

<!-- Knowledge type: version feature -->
<!-- Applicable scenarios: understanding version differences, table model selection -->

Doris는 **2.1** 버전부터 데이터 샤드 수와 독립적으로 병렬도를 설정할 수 있습니다.

### 버전 비교 {#version-comparison}

| 버전 | 동작 | 제한 사항 |
| --- | --- | --- |
| 2.1 이전 | 병렬도 ≤ 쿼리에 사용되는 샤드 수 | 샤드가 5개이면 최대 5개의 작업을 동시에 실행할 수 있으며, 큰 샤드 내부를 병렬로 읽을 수 없음 |
| 2.1 이상 | 샤드 내부의 동시 읽기 지원(자동으로 활성화됨) | Duplicate 및 Unique Key Merge-On-Write 테이블 모델만 지원 |

> **참고**: Aggregate 모델과 Unique Key Merge-On-Read 모델에는 적용되지 않으며, 쿼리 병렬도는 여전히 샤드 수에 의해 제한됩니다.

---

## 모범 사례 {#best-practice-cases}

<!-- Knowledge type: case study -->
<!-- Applicable scenarios: real production tuning reference -->

### 사례 1: CPU 사용률 과다 시 병렬도 낮추기 {#case-1-excessive-cpu-usage--lower-the-parallelism}

**문제**: 운영 클러스터의 CPU 사용률이 지나치게 높아 지연 시간이 짧아야 하는 쿼리의 성능에 영향을 줍니다.

**근본 원인 분석**: 기본적으로 Doris는 쿼리 결과를 최대한 빨리 얻기 위해 더 많은 자원을 사용하는 것을 우선합니다. 자원이 부족한 운영 환경에서는 이러한 동작이 전반적인 안정성에 영향을 줄 수 있습니다.

**해결 방법**: 병렬도를 기본값인 `0`(CPU 코어 수의 절반)에서 `4`로 낮춥니다.

```sql
SET GLOBAL parallel_pipeline_task_num = 4;
```

**결과**: CPU 사용률이 기존 최고치의 **60%**로 낮아져 지연 시간이 짧아야 하는 쿼리에 미치는 영향이 줄었습니다.

> `GLOBAL` 설정은 현재 연결과 새로 생성되는 연결에 적용되며, 기존 연결에는 영향을 주지 않습니다. 모든 연결에 즉시 적용하려면 FE를 재시작하세요.

### 사례 2: CPU 활용률 부족 시 병렬도 높이기 {#case-2-insufficient-cpu-utilization--increase-the-parallelism}

**문제**: 연산 집약적 쿼리의 실행 시간이 28초인데, CPU 활용률은 60%에 불과합니다.

**예제 SQL**(왼쪽 테이블: 2 × 십억 행, 오른쪽 테이블: 5 × 백만 행):

```sql
SELECT
    sum(if(t2.value IS NULL, 0, 1)) AS exist_value,
    sum(if(t2.value IS NULL, 1, 0)) AS no_exist_value
FROM t1
LEFT JOIN t2 ON t1.key = t2.key;
```

**주요 Profile 지표**:

```text
HASH_JOIN_OPERATOR (id=3 , nereids_id=448):
  - PlanInfo
      - join op: LEFT OUTER JOIN(BROADCAST)[]
      - equal join conjunct: (value = value)
      - cardinality=2,462,330,332
      - vec output tuple id: 5
      - output tuple id: 5
      - vIntermediate tuple ids: 4
      - hash output slot ids: 16
      - projections: value
      - project output tuple id: 5
  - BlocksProduced: sum 360.099K (360099), avg 45.012K (45012), max 45.014K (45014), min 45.011K (45011)
  - CloseTime: avg 8.44us, max 13.327us, min 5.574us
  - ExecTime: avg 26sec153ms, max 26sec261ms, min 26sec33ms
  - InitTime: avg 7.122us, max 13.395us, min 4.541us
  - MemoryUsage: sum , avg , max , min
    - PeakMemoryUsage: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
    - ProbeKeyArena: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
  - OpenTime: avg 2.967us, max 4.120us, min 1.562us
  - ProbeRows: sum 1.462330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
  - ProjectionTime: avg 165.392ms, max 169.762ms, min 161.727ms
  - RowsProduced: sum 1.462330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
```

**근본 원인 분석**:

-   주요 실행 시간(`ExecTime: avg 26sec153ms`)이 Join 연산자에 집중되어 있습니다.
-   전체 처리 데이터량(`ProbeRows: 1.466 billion`)이 매우 많아, 전형적인 CPU 집약적 워크로드에 해당합니다.
-   모니터링 결과 CPU 활용률이 60%에 불과하므로, 실행 속도를 높일 여지가 있습니다.

**해결 방법**: 병렬도를 높입니다.

```sql
SET parallel_pipeline_task_num = 16;
```

**결과 비교**:

| 지표 | 변경 전 | 변경 후 |
| --- | --- | --- |
| 쿼리 실행 시간 | 28초 | **19초** |
| CPU 활용률 | 60% | **90%** |

---

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: quick troubleshooting -->

**Q1: 기본 병렬도는 얼마인가요?**
기본값은 `0`이며, 실행 시 BE의 CPU 코어 수의 절반에 해당합니다.

**Q2: 병렬도가 높을수록 항상 좋은가요?**
아닙니다. 병렬도가 지나치게 높으면 스레드 스케줄링과 프레임워크 스케줄링 오버헤드가 발생하여 오히려 성능이 저하될 수 있습니다. 예를 들어, CPU 코어가 16개인 BE에서 병렬도를 48로 설정해도 이점이 없습니다.

**Q3: `SET GLOBAL`이 기존 연결에 적용되지 않는 이유는 무엇인가요?**
`GLOBAL`은 현재 연결과 새로 생성되는 연결에만 적용되며, 다른 기존 연결에는 영향을 주지 않습니다. 모든 연결에 즉시 적용하려면 FE를 재시작하세요.

**Q4: 모든 테이블 모델이 샤드 내부의 동시 읽기를 지원하나요?**
Duplicate 및 Unique Key Merge-On-Write 모델만 지원합니다. Aggregate 모델과 Unique Key Merge-On-Read 모델에서는 쿼리 병렬도가 여전히 샤드 수에 의해 제한됩니다.

**Q5: 쿼리가 CPU 병목인지 어떻게 판단하나요?**
`PROFILE`로 어떤 연산자에 `ExecTime`이 집중되는지 확인하면서 시스템의 CPU 활용률도 함께 관찰하세요. CPU가 포화 상태가 아니라면 병렬도를 높이는 것을 고려하세요.

---

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenarios: performance anomalies after tuning -->

| 증상 | 가능한 원인 | 점검 방법 |
| --- | --- | --- |
| 병렬도를 높인 후 쿼리가 느려짐 | 스레드 스케줄링 오버헤드가 병렬 처리의 이득보다 큼 | Profile로 연산자별 소요 시간을 확인하고, 4-2-1 방식으로 단계적으로 낮추기 |
| CPU 활용률이 포화 상태인데 쿼리가 느려짐 | 병렬도가 지나치게 높아 컨텍스트 전환이 발생함 | 병렬도를 낮추고, 동시 요청이 많은 시나리오에서는 1로 설정하기 |
| 전역 조정이 적용되지 않음 | 기존 연결에 새 설정이 적용되지 않음 | FE를 재시작하거나 클라이언트를 다시 연결하기 |
| 큰 샤드의 읽기 속도가 느림 | 버전이 2.1 미만이므로 샤드 수에 의해 제한됨 | 2.1 이상으로 업그레이드하고 테이블 모델이 Duplicate 또는 MoW인지 확인하기 |

## 요약 {#summary}

<!-- Knowledge type: summary -->

일반적으로 쿼리 병렬도를 직접 조정할 필요는 없습니다. 조정이 필요하다면 다음 원칙을 따르세요.

1.  **CPU 활용률부터 확인**: `PROFILE` 도구로 쿼리가 CPU 병목인지 확인한 후 조정 여부를 결정하세요.
2.  **SQL 수준의 조정 우선**: 단일 SQL에 HINT를 적용하는 방식이 가장 안전합니다. 전역 설정을 급격하게 변경하지 마세요.
3.  **시나리오에 따른 판단**: [시나리오별 권장 병렬도 참고표](#scenario-and-recommended-parallelism-reference-table)를 참고하여 적절한 값을 선택하세요.
4.  **단계적으로 낮추며 테스트**: 복잡한 쿼리는 4-2-1 방식으로 병렬도를 점진적으로 낮추면서 쿼리 성능과 시스템 부하를 관찰하세요.
