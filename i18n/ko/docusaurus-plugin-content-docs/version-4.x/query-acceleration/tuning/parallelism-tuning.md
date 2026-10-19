---
{
    "title": "병렬도 튜닝: parallel_pipeline_task_num은 어떻게 설정하나요?",
    "language": "ko",
    "description": "Doris 쿼리 병렬도(parallel_pipeline_task_num)는 어떻게 튜닝할까요? 언제 1이나 16으로 설정하고, 언제 기본값을 유지해야 할까요? SQL, 세션, 전역 수준의 세 가지 조정 방법과 모범 사례를 설명합니다.",
    "keywords": ["Doris 병렬도 튜닝", "parallel_pipeline_task_num", "Pipeline 실행 엔진", "MPP 병렬 실행", "쿼리 성능 튜닝", "BE CPU 사용률"],
    "sidebar_label": "병렬도 튜닝"
}
---

<!-- Knowledge type: Performance tuning guide -->
<!-- Applicable scenarios: High query latency, insufficient CPU utilization, stress testing, slow JOIN/aggregation -->

# 병렬도 튜닝 {#parallelism-tuning}

병렬도(`parallel_pipeline_task_num`)는 단일 Fragment가 BE 내에서 실행될 때 사용하는 워커 태스크 수를 제어합니다. 멀티코어 CPU를 충분히 활용하고 쿼리 지연 시간을 줄이는 데 중요한 매개변수입니다.

## 튜닝 전 자체 점검 목록 {#pre-tuning-self-check-checklist}

<!-- Knowledge type: Pre-check -->
<!-- Applicable scenarios: Before adjusting parameters -->

- [ ] BE의 CPU 코어 수를 확인했습니다. CPU 코어 수는 병렬도의 상한을 결정합니다.
- [ ] Profile이나 모니터링 지표를 사용하여 병목 유형(CPU 집약적, 스캔 집약적 또는 스케줄링 오버헤드)을 파악했습니다.
- [ ] 현재 쿼리 시나리오(포인트 쿼리, JOIN/집계, 부하 테스트 또는 복잡한 쿼리)를 이해하고 있습니다.
- [ ] 기본값(`0`, CPU 코어 수의 절반을 의미)을 사용했을 때 성능이 실제로 기대에 미치지 못합니다.

## 핵심 개념 {#core-concepts}

<!-- Knowledge type: Term definition -->
<!-- Applicable scenarios: Understanding the parallelism model -->

- **MPP 병렬도**: 각 쿼리가 여러 BE에 걸쳐 병렬로 실행됩니다.
- **BE 내부 병렬도**: 단일 BE 내에서 멀티스레딩으로 Fragment 실행을 가속합니다.
- **`parallel_pipeline_task_num`**: 단일 Fragment가 실행 중에 사용하는 워커 태스크 수입니다. 기본값 `0`은 BE의 CPU 코어 수의 절반을 의미합니다.
- **적용 가능한 문**: 모든 쿼리, DML, DDL 문은 병렬 실행을 지원합니다.

## 튜닝 원칙 {#tuning-principles}

<!-- Knowledge type: Decision principle -->
<!-- Applicable scenarios: Deciding whether to adjust the parameter -->

병렬도는 높을수록 좋은 것이 아닙니다.

1. 병렬도를 높이면 멀티코어 리소스를 충분히 활용하여 단일 쿼리의 지연 시간을 줄일 수 있습니다.
2. 하지만 데이터 Shuffle 연산자와 멀티스레드 동기화 로직이 추가되어 리소스가 낭비될 수 있습니다.
3. 기본값은 이미 단일 쿼리와 동시 실행 시나리오 사이의 균형을 고려하므로 **대부분 수동으로 조정할 필요가 없습니다**.
4. Doris는 적응형 전략을 지속적으로 개선하고 있습니다. 전역 수준보다는 **SQL 또는 시나리오 수준의 조정을 우선하세요**.

## 시나리오별 튜닝 권장 사항 {#scenario-based-tuning-recommendations}

<!-- Knowledge type: Scenario recipe -->
<!-- Applicable scenarios: Choosing parallelism based on query type -->

다음 예시는 BE에 CPU 코어가 16개 있다고 가정합니다.

### 시나리오별 참고 표 {#scenario-reference-table}

| 쿼리 시나리오 | 권장 병렬도 | 이유 |
|---|---|---|
| 단일 테이블 포인트 쿼리 / 소량의 데이터에 대한 `WHERE` / `LIMIT` / 구체화된 뷰 활용 | **1** | Fragment가 하나만 존재합니다. 병목은 스캔 스레드에 있으며, 스캔 스레드는 쿼리 스레드와 독립적으로 동작하고 적응형으로 병렬 처리하므로 쿼리 스레드의 동시성을 추가로 높일 필요가 없습니다. |
| 대규모 데이터셋에서 두 테이블 간 `JOIN` / 집계 쿼리(CPU 집약적) | **16** | 연산 집약적입니다. CPU가 포화 상태가 아니라면 병렬도를 높여 코어를 충분히 활용할 수 있습니다. 다만 제한 없이 높여서는 안 됩니다. 예를 들어 48로 설정하면 스케줄링 오버헤드만 늘어납니다. |
| 부하 테스트 시나리오 | **1** | 동시 실행 쿼리만으로도 CPU가 이미 포화되며, 과도한 병렬도는 스레드 및 프레임워크 스케줄링 오버헤드만 늘립니다. |
| 복잡한 쿼리 | **기본값** | Profile과 시스템 부하를 기준으로 유연하게 조정합니다. **4 -> 2 -> 1**로 단계적으로 낮추면서 효과를 확인하세요. |

### 시나리오 1: 간단한 단일 테이블 작업 {#scenario-1-simple-single-table-operations}

<!-- Applicable scenarios: Point queries, light filtering, materialized views -->

- **특징**: Fragment가 하나이며, 병목은 이미 적응형으로 병렬 처리하는 스캔 스레드에 있습니다.
- **권장 설정**: `parallel_pipeline_task_num = 1`.
- **이유**: 스캔 스레드와 쿼리 실행 스레드는 서로 독립적입니다. 동시에 실행되는 쿼리 스레드를 늘려도 스캔으로 인한 병목은 개선되지 않습니다.

### 시나리오 2: 대규모 데이터셋의 JOIN/집계 {#scenario-2-joinaggregation-over-large-datasets}

<!-- Applicable scenarios: CPU-intensive analytical queries -->

- **특징**: CPU가 포화 상태에 이르지 않은 것으로 관측되는 연산 집약적 워크로드입니다.
- **권장 설정**: 병렬도를 기본값보다 높입니다. 예를 들어 `parallel_pipeline_task_num = 16`으로 설정합니다.
- **이유**: Pipeline 실행 엔진의 병렬 처리 기능을 활용하여 CPU를 충분히 사용할 수 있습니다. 다만 제한 없이 높이면 스레드 및 프레임워크 스케줄링 오버헤드가 성능 향상 효과를 초과하게 됩니다.

### 시나리오 3: 부하 테스트 {#scenario-3-stress-testing}

<!-- Applicable scenarios: High-concurrency stress testing -->

- **특징**: 동시에 실행되는 쿼리가 충분히 많아 여러 쿼리로 인해 CPU가 이미 포화된 상태입니다.
- **권장 설정**: `parallel_pipeline_task_num = 1`.
- **이유**: 높은 동시성에 단일 쿼리의 병렬도까지 더해져 발생하는 스케줄링 오버헤드를 방지합니다.

### 시나리오 4: 복잡한 쿼리 {#scenario-4-complex-queries}

<!-- Applicable scenarios: Multi-table JOINs, complex subqueries -->

- **특징**: 실행 계획이 복잡하여 병목을 한눈에 파악하기 어렵습니다.
- **권장 설정**: 기본값으로 시작한 후 Profile과 시스템 부하를 기준으로 **4 -> 2 -> 1**과 같이 단계적으로 조정하며 효과를 확인합니다.

## 튜닝 방법 {#tuning-methods}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Issuing the actual tuning command -->

Doris는 SQL 수준, 세션 수준, 전역 수준의 세 가지 범위에서 병렬도 설정을 지원합니다. 우선순위는 이 순서대로 낮아집니다.

### 방법 비교 {#method-comparison}

| 방법 | 범위 | 적용 시나리오 | 위험 |
|---|---|---|---|
| SQL HINT | 단일 SQL 문 | 특정 느린 SQL 튜닝 | 다른 쿼리에 영향을 주지 않아 가장 권장됨 |
| 세션 변수 | 현재 세션 | 동일한 세션 내의 쿼리 그룹 | 단일 행 쿼리에도 이 설정이 적용되므로 성능이 저하될 수 있음 |
| 전역 변수 | 클러스터 전체의 모든 새 연결 | 클러스터 전체의 CPU 사용률 조정 | 영향 범위가 가장 넓으므로 주의해서 사용 |

### SQL 수준 조정 {#sql-level-adjustment}

<!-- Applicable scenarios: Targeting individual slow SQL statements -->

- **목적**: HINT를 사용하여 단일 SQL 문의 병렬도를 정밀하게 제어하며, 가장 유연하게 조정할 수 있습니다.
- **명령**:

    ```sql
    SELECT /*+SET_VAR(parallel_pipeline_task_num=8)*/ *
    FROM nation, lineitem
    WHERE lineitem.l_suppkey = nation.n_nationkey;

    SELECT /*+SET_VAR(parallel_pipeline_task_num=8,runtime_filter_mode=global)*/ *
    FROM nation, lineitem
    WHERE lineitem.l_suppkey = nation.n_nationkey;
    ```

- **참고**: 동일한 HINT 내에서 다른 세션 변수(예: `runtime_filter_mode`)도 함께 설정할 수 있습니다.

### 세션 수준 조정 {#session-level-adjustment}

<!-- Applicable scenarios: Running a batch of similar queries in the same session -->

- **목적**: 현재 세션의 모든 SQL 문에 동일한 병렬도 설정을 적용합니다.
- **명령**:

    ```sql
    SET parallel_pipeline_task_num = 8;
    ```

- **참고**: 세션 내에서는 단일 행 포인트 쿼리도 이 병렬도로 실행되므로 가벼운 쿼리가 느려질 수 있습니다.

### 전역 조정 {#global-adjustment}

<!-- Applicable scenarios: Cluster-wide CPU utilization adjustment -->

- **목적**: 모든 새 연결에 적용되어 클러스터 전체의 기본 동작에 영향을 줍니다.
- **명령**:

    ```sql
    SET GLOBAL parallel_pipeline_task_num = 8;
    ```

- **참고**: 클러스터 전체의 CPU 사용률을 조정해야 할 때만 사용하세요. 그 외에는 기본값을 유지하세요.

## FAQ / 문제 해결 {#faq--troubleshooting}

<!-- Knowledge type: Frequently asked questions -->
<!-- Applicable scenarios: When tuning does not meet expectations -->

### Q1: 병렬도를 높인 후 쿼리가 더 느려지는 이유는 무엇인가요? {#q1-why-is-the-query-slower-after-i-increased-the-parallelism}

병렬도가 지나치게 높으면 Shuffle과 스레드 동기화 오버헤드가 늘어나며, 스케줄링 프레임워크 자체에도 오버헤드가 있습니다. 예를 들어 코어 수가 16개인 시스템에서 병렬도를 48로 설정하면 이점은 거의 없고 스케줄링 비용만 늘어납니다. 기본값으로 시작하여 **4 -> 2 -> 1**과 같이 단계적으로 조정하세요.

### Q2: 단일 테이블 포인트 쿼리의 권장 병렬도가 1인 이유는 무엇인가요? {#q2-why-is-the-recommended-parallelism-for-a-single-table-point-query-1}

단일 테이블 포인트 쿼리에는 Fragment가 하나만 있으며, 병목은 데이터 스캔에 있습니다. 스캔 스레드와 쿼리 실행 스레드는 분리되어 있고, 스캔 스레드는 적응형으로 병렬 처리합니다. 따라서 `parallel_pipeline_task_num`을 높여도 스캔으로 인한 병목은 개선되지 않습니다.

### Q3: 부하 테스트에서도 병렬도 1을 권장하는 이유는 무엇인가요? {#q3-why-is-parallelism-1-also-recommended-for-stress-testing}

부하 테스트에서는 많은 쿼리가 동시에 실행되어 CPU가 이미 포화됩니다. 여기에 단일 쿼리의 병렬도까지 더하면 스레드 스케줄링 및 프레임워크 스케줄링 오버헤드만 늘어납니다.

### Q4: 기본값 `0`은 무엇을 의미하나요? {#q4-what-does-the-default-value-0-mean}

`parallel_pipeline_task_num = 0`은 BE가 자동으로 **CPU 코어 수의 절반**을 사용한다는 의미입니다. 이 기본값은 단일 쿼리 성능과 동시 실행 처리량 사이의 균형을 고려하며, 대부분의 시나리오에서는 변경할 필요가 없습니다.

### Q5: 전역 병렬도를 설정해야 하나요, 아니면 SQL HINT를 사용해야 하나요? {#q5-should-i-set-the-global-parallelism-or-use-a-sql-hint}

개별적으로 느린 SQL 문을 튜닝할 때는 SQL HINT를 우선 사용하세요. 클러스터 전체의 CPU 사용률을 전반적으로 조정해야 한다고 확인한 경우에만 `SET GLOBAL`을 사용하세요.

## 관련 매개변수 {#related-parameters}

<!-- Knowledge type: Parameter index -->

| 매개변수 | 용도 | 기본값 |
|---|---|---|
| `parallel_pipeline_task_num` | BE 내 단일 Fragment의 워커 태스크 수 | `0` (BE CPU 코어 수 / 2) |
| `runtime_filter_mode` | Runtime Filter의 동작 모드로, 병렬도와 함께 튜닝하는 경우가 많음 | Runtime Filter 문서 참조 |
