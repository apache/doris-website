---
{
    "title": "성능 튜닝 절차 가이드",
    "language": "ko",
    "description": "Doris의 느린 쿼리를 체계적으로 튜닝하려면 어떻게 해야 할까요? 이 문서에서는 느린 SQL 식별, 스키마 튜닝, 실행 계획 튜닝, 실행 튜닝으로 구성된 네 단계의 튜닝 절차를 도구 및 시나리오와 함께 소개합니다.",
    "keywords": ["Doris 성능 튜닝", "느린 쿼리 식별", "스키마 튜닝", "실행 계획 튜닝", "Profile 분석", "튜닝 절차"]
}
---

<!-- Knowledge type: process methodology -->
<!-- Applicable scenarios: slow query tuning, performance bottleneck identification, systematic performance optimization -->

Doris의 성능 튜닝은 방법론적 지침에 따라 체계적으로 진행해야 하는 작업입니다. Doris는 체계적인 진단을 지원하는 [진단 도구](diagnostic-tools.md)와 [분석 도구](analysis-tools.md)를 제공하므로, 성능 문제를 효율적으로 식별하고 분석하며 해결할 수 있습니다.

**튜닝 전 자가 점검 목록:**

- 느린 SQL이나 성능 저하가 발생했음을 확인했습니다.
- FE 노드 로그 또는 Doris Manager에 접근할 수 있습니다.
- 업무 테이블의 스키마 설계와 쿼리 패턴을 잘 알고 있습니다.
- `EXPLAIN`, `Profile`과 같은 기본 분석 도구를 이해하고 있습니다.

전체 튜닝 절차는 다음 네 단계로 구성됩니다.

![성능 튜닝 절차](/images/query-tuning-steps.jpg)

| 단계 | 작업 | 핵심 목표 | 주요 도구 |
| --- | --- | --- | --- |
| 1단계 | 느린 쿼리 식별 | 튜닝이 필요한 SQL 문 식별 | Doris Manager, `fe.audit.log`, `audit_log` 테이블 |
| 2단계 | 스키마 튜닝 | 설계 수준의 병목 제거 | 파티셔닝 및 버킷팅, 인덱스, Colocate Group |
| 3단계 | 실행 계획 튜닝 | 실행 계획 최적화 | `EXPLAIN`, 구체화된 뷰, Hint |
| 4단계 | 실행 튜닝 | 실행 시 성능 최적화 | `Profile`, Runtime Filter, 병렬 처리 매개변수 |

## 1단계: 느린 쿼리 식별 {#step-1-slow-query-identification}

<!-- Knowledge type: operational guide -->
<!-- Applicable scenarios: identifying slow SQL that needs tuning -->

**목표**: 업무 시스템에서 튜닝이 필요한 느린 SQL 문을 추려냅니다.

**접근 방법**:

| 시나리오 | 권장 방법 | 설명 |
| --- | --- | --- |
| Doris Manager가 배포된 경우 | Manager 로그 페이지 사용 | 필터링과 정렬이 편리한 시각적 인터페이스 제공 |
| Doris Manager가 배포되지 않은 경우 | FE 노드의 `fe.audit.log` 또는 `audit_log` 시스템 테이블 조회 | 느린 SQL 목록을 확보한 후 우선순위를 정해 순서대로 튜닝 |

도구 사용법에 대한 자세한 내용은 [진단 도구](diagnostic-tools.md)를 참조하세요.

## 2단계: 스키마 설계 및 튜닝 {#step-2-schema-design-and-tuning}

<!-- Knowledge type: tuning method -->
<!-- Applicable scenarios: performance issues caused by unreasonable table structure or index design -->

느린 SQL을 식별한 후에는 먼저 업무 스키마 설계를 점검하여 설계 수준에서 발생하는 성능 문제를 배제합니다. 스키마 튜닝은 다음 세 가지 영역을 다룹니다.

| 튜닝 방향 | 주요 내용 | 참고 문서 |
| --- | --- | --- |
| 테이블 수준의 스키마 튜닝 | 파티션 및 버킷 수, 필드 타입 | [테이블 스키마 최적화](../tuning/tuning-plan/optimizing-table-schema.md) |
| 인덱스 설계 튜닝 | Prefix index, Bloom filter, inverted index 등 | [테이블 인덱스 최적화](../tuning/tuning-plan/optimizing-table-index.md) |
| 특수 최적화 기법 | Colocate Group 등 | [Colocate Group을 사용한 Join 최적화](../colocation-join.md) |

자세한 사례는 [실행 계획 튜닝](../tuning/tuning-plan/optimizing-table-schema.md)을 참조하세요.

## 3단계: 실행 계획 튜닝 {#step-3-plan-tuning}

<!-- Knowledge type: tuning method -->
<!-- Applicable scenarios: performance bottlenecks caused by unreasonable execution plans -->

스키마 점검을 마치면 본격적인 튜닝 단계에 들어갑니다. 이 단계에서는 Doris의 각 계층에서 `EXPLAIN` 도구를 충분히 활용하여 느린 SQL의 실행 계획을 체계적으로 분석하고 핵심 최적화 지점을 찾습니다.

**시나리오별 튜닝 기법:**

-   **단일 테이블 쿼리/분석 시나리오**
    -   실행 계획을 분석하고 [파티션 프루닝](../tuning/tuning-plan/optimizing-table-scanning.md)이 적용되는지 확인합니다.
    -   [단일 테이블 구체화된 뷰를 사용하여 쿼리를 가속화합니다](../tuning/tuning-plan/transparent-rewriting-with-sync-mv.md).

-   **복잡한 다중 테이블 분석 시나리오**
    -   Join Order가 적절한지 분석하고 성능 병목을 찾습니다.
    -   [다중 테이블 구체화된 뷰를 사용한 투명한 재작성](../tuning/tuning-plan/transparent-rewriting-with-async-mv.md)으로 쿼리를 가속화합니다.
    -   Hint를 통해 실행 계획을 수동으로 고정합니다.
        -   [Leading Hint를 사용한 Join Order 제어](../tuning/tuning-plan/reordering-join-with-leading-hint.md)
        -   [Shuffle Hint를 사용한 Join 셔플 방식 조정](../tuning/tuning-plan/adjusting-join-shuffle.md)
        -   [Hint를 사용한 비용 기반 재작성 동작 제어](../tuning/tuning-plan/controlling-hints-with-cbo-rule.md)

-   **특수 가속화 시나리오**
    -   [SQL Cache를 사용한 쿼리 가속화](../sql-cache-manual.md)

자세한 사례는 [실행 계획 튜닝](../tuning/tuning-plan/optimizing-table-schema.md)을 참조하세요.

## 4단계: 실행 튜닝 {#step-4-execution-tuning}

<!-- Knowledge type: tuning method -->
<!-- Applicable scenarios: the execution plan is reasonable but runtime performance does not meet expectations -->

실행 튜닝 단계에서는 SQL의 실제 실행 동작을 바탕으로 실행 계획 튜닝의 효과를 검증하고, 실행 단계별 소요 시간 분포나 병렬 처리 부족과 같은 실행 측 병목을 계속 분석해야 합니다.

**다중 테이블 분석 쿼리를 예로 들면, Profile을 통해 다음 사항을 확인할 수 있습니다.**

-   플래너가 선택한 Join 순서가 적절한지 여부.
-   Runtime Filter가 적용되는지 여부.
-   병렬 처리 수준이 기대에 부합하는지 여부.
-   시스템 부하(예: 느린 IO 또는 기대에 미치지 못하는 네트워크 전송 성능).

시스템 부하 문제는 시스템 수준의 도구를 함께 사용하여 진단해야 합니다. 자세한 사례는 [실행 튜닝](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md)을 참조하세요.

:::tip 팁
특정 성능 문제를 분석할 때는 **먼저 실행 계획을 점검하고 그다음 실행을 튜닝하는 순서를 권장합니다**. 먼저 `EXPLAIN`으로 실행 계획을 확인한 후, `Profile`로 실행 성능 문제를 찾으세요. 순서를 바꾸면 작업 효율이 떨어지고 문제를 신속하게 파악하기 어려워질 수 있습니다.
:::

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: common questions during the tuning process -->

**Q1: 스키마 튜닝과 실행 계획 튜닝 중 무엇을 먼저 해야 하나요?**

스키마 튜닝을 먼저 해야 합니다. 잘못된 파티셔닝/버킷팅 필드나 필요한 인덱스 누락과 같은 부적절한 스키마 설계는 실행 계획 자체의 최적화를 가로막습니다. 스키마 문제를 먼저 해결하면 결함이 있는 기반 위에서 튜닝을 반복하는 일을 피할 수 있습니다.

**Q2: `EXPLAIN`과 `Profile`의 차이점은 무엇인가요?**

| 도구 | 출력 | 사용 단계 |
| --- | --- | --- |
| `EXPLAIN` | 정적 실행 계획(실제로 실행하지 않음) | 실행 계획 튜닝 |
| `Profile` | 실제 실행 시 측정한 소요 시간과 리소스 지표 | 실행 튜닝 |

**Q3: Join Order가 적절하지 않을 때는 어떻게 해야 하나요?**

`EXPLAIN` 출력을 검토하고 [Leading Hint](../tuning/tuning-plan/reordering-join-with-leading-hint.md)를 사용하여 Join 순서를 수동으로 지정하세요.

**Q4: IO나 네트워크가 느린 문제는 어떻게 해결하나요?**

`Profile`로 시스템 부하를 파악할 수 있지만, 근본 원인을 찾으려면 `iostat`, `sar`, `netstat`과 같은 운영체제 수준의 도구를 함께 사용하여 하드웨어나 네트워크 병목을 조사해야 합니다.

## 요약 {#summary}

Doris는 느린 쿼리 식별, 스키마 설계, 실행 계획부터 실행 시 성능까지 전 과정의 진단을 지원하는 다양한 튜닝 도구를 제공합니다. 업무 사용자와 DBA는 "식별 -> 스키마 -> 실행 계획 -> 실행"의 네 단계 절차에 따라 체계적으로 튜닝하여 Doris의 성능상 이점을 충분히 활용하는 것이 좋습니다.
