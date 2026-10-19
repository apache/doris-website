---
{
    "title": "비동기 구체화된 뷰 모범 사례",
    "language": "ko",
    "description": "비동기 구체화된 뷰는 어떤 경우에 적합할까요? 새로 고침 전략은 어떻게 선택하고, 어떻게 구현할까요? 이 문서에서는 시나리오 평가, 사용 원칙, 새로 고침 전략 선택, 구현 방법, 운영 시 고려 사항을 다룹니다.",
    "keywords": ["비동기 구체화된 뷰", "사용 권장 사항", "모범 사례", "새로 고침 전략", "Incremental View Maintenance", "IVM", "파티션 구체화된 뷰", "투명 재작성", "데이터 계층 모델링", "Doris"]
}
---

<!-- Knowledge type: usage guide / best practices -->
<!-- Applicable scenarios: query acceleration, ETL data modeling, lakehouse federated query, write optimization -->

비동기 구체화된 뷰는 쿼리 결과를 미리 계산하고 저장하여 쿼리를 가속하지만, 새로 고침할 때마다 컴퓨팅 및 IO 오버헤드가 발생합니다. 이 문서에서는 **시나리오 평가, 사용 원칙, 새로 고침 전략 선택, 구현 방법, 운영 시 고려 사항**을 순서대로 살펴보며, DBA와 개발자가 효율적인 비동기 구체화된 뷰를 구축할 수 있도록 안내합니다.

구체화된 뷰의 새로 고침 원리는 [새로 고침 원리](../overview.md)를 참조하세요.

## 빠른 판단 체크리스트 {#quick-decision-checklist}

비동기 구체화된 뷰를 생성하기 전에 다음 체크리스트로 적합성을 평가하세요.

- 쿼리에 다중 테이블 JOIN, 복잡한 집계 또는 윈도우 함수가 포함되어 있나요?
- 기본 테이블의 데이터 갱신 빈도가 비교적 낮은가요(분당 여러 번 갱신되는 경우는 피하세요)?
- 업무에서 분 단위 이상의 데이터 지연을 허용할 수 있나요(1~5분 이내의 실시간 데이터가 필수는 아닌가요)?
- 기본 테이블의 데이터가 충분히 많은가요(수백 행보다 훨씬 많은가요)?
- 자주 사용하는 쿼리 SQL 패턴을 그룹으로 묶을 수 있고, 그룹 간 중복이 없나요?
- 기본 테이블이 파티션 테이블이며, 파티션 구체화된 뷰를 구축할 수 있나요?
- 주기적인 새로 고침에 필요한 리소스가 충분한가요?
- 구체화된 뷰의 사용 현황을 주기적으로 확인하고 사용하지 않는 뷰를 제때 정리할 수 있나요?

위 질문 대부분에 **예**라고 답할 수 있다면 비동기 구체화된 뷰가 적합합니다.

---

## 1. 시나리오 평가 {#1-scenario-assessment}

<!-- Knowledge type: scenario assessment -->

아래 표는 비동기 구체화된 뷰를 **권장하는** 대표적인 시나리오와 **권장하지 않는** 시나리오를 빠르게 확인할 수 있도록 정리한 것입니다.

### 시나리오 요약 {#scenario-quick-reference}

| 범주 | 시나리오 | 주요 특징 | 권장 여부 |
|---|---|---|---|
| 쿼리 복잡도 | 복잡한 집계 쿼리 | 다중 테이블 JOIN, SUM/AVG/COUNT, 윈도우 함수 | 예 |
| 보고서 | 일관된 스냅샷 보고서 | 정해진 시점에 생성(예: 매일 자정) | 예 |
| 연산 집약적 작업 | 연산 집약적 분석 | 복잡한 수학 연산, 데이터 변환, 예측 모델 | 예 |
| 데이터 웨어하우스 모델링 | 스타 / 스노우플레이크 스키마 | 팩트 테이블 + 여러 차원 테이블 JOIN | 예 |
| 레이크하우스 | 레이크하우스 가속 | 네트워크와 객체 스토리지 처리량으로 인해 성능이 제한되는 데이터 레이크 쿼리 | 예 |
| 데이터 웨어하우스 계층화 | ETL 계층별 처리 | 기본 테이블에 원시 데이터가 있으며 여러 계층의 처리가 필요함 | 예 |
| 데이터 갱신 | 자주 갱신되는 기본 테이블 | 분당 여러 번 갱신 | 아니요 |
| 쿼리 복잡도 | 단순 쿼리 | 단일 테이블 스캔 또는 단순 필터 | 아니요 |
| 적시성 | 실시간에 가까운 데이터(1~5분 이내) | 업무상 항상 최신 데이터가 필요함 | 아니요 |
| 데이터 규모 | 매우 작은 원본 테이블 | 수백 행에 불과함 | 아니요 |

### 권장 시나리오 {#recommended-scenarios}

#### 복잡한 집계 쿼리 {#complex-aggregation-queries}

- **설명**: 다중 테이블 조인, 복잡한 집계 함수(예: SUM, AVG, COUNT) 또는 윈도우 함수가 포함된 쿼리입니다.
- **이점**: 실행할 때마다 복잡한 로직을 다시 계산하지 않아도 됩니다.

#### 보고서 {#reports}

- **설명**: 정해진 시점(예: 매일 자정)에 생성된 일관된 스냅샷이 필요한 보고서입니다.
- **이점**: 모든 사용자가 동일한 시점의 데이터를 볼 수 있습니다.

#### 연산 집약적 분석 {#compute-intensive-analysis}

- **설명**: 고객 생애 가치 계산이나 예측 분석 모델처럼 복잡한 수학 연산 또는 데이터 변환이 포함된 분석 쿼리입니다.
- **이점**: 결과를 미리 계산하여 실행 시 리소스 사용량을 줄입니다.

#### 데이터 웨어하우스의 스타 / 스노우플레이크 스키마 {#star--snowflake-schema-in-data-warehouses}

- **설명**: 판매 팩트 테이블을 제품, 시간, 지역 차원과 조인하는 경우처럼 팩트 테이블이 여러 차원 테이블과 조인되는 시나리오입니다.
- **이점**: 조인 결과를 미리 구체화하여 분석 쿼리를 가속합니다.

#### 레이크하우스 가속 {#lakehouse-acceleration}

- **설명**: 데이터 레이크 쿼리는 네트워크 지연과 객체 스토리지 처리량 제한으로 인해 느려질 수 있습니다.
- **이점**: Doris 로컬 스토리지의 가속 기능을 활용하여 데이터 레이크 분석 속도를 높입니다.

#### 데이터 웨어하우스 계층화 {#data-warehouse-layering}

- **설명**: 기본 테이블에 대량의 원시 데이터가 있고, 쿼리에 복잡한 ETL 작업이 필요합니다.
- **이점**: 데이터 위에 여러 계층의 비동기 구체화된 뷰를 구축하여 데이터 웨어하우스 계층화를 구현할 수 있습니다.

### 권장하지 않는 시나리오 {#scenarios-not-recommended}

#### 자주 갱신되는 기본 테이블 {#frequently-updated-base-tables}

- **설명**: 원본 테이블 데이터가 매우 자주 변경됩니다(예: 분당 여러 번 갱신).
- **문제점**: 전체 새로 고침이나 파티션 새로 고침 비용이 지나치게 클 수 있습니다. 매번 변경되는 행이 테이블이나 파티션에서 차지하는 비중이 작다면 [Incremental View Maintenance (IVM)](incremental-materialized-view)를 검토하세요. IVM도 비동기로 새로 고침하며 실시간 일관성을 제공하지 않습니다.

#### 단순 쿼리 {#simple-queries}

- **설명**: 단일 테이블 스캔이나 단순 필터링만 수행하는 쿼리입니다.
- **문제점**: 비동기 구체화된 뷰의 이점이 새로 고침 비용을 상쇄하지 못합니다.

#### 실시간 데이터가 필요한 시나리오(1~5분 이내) {#scenarios-requiring-real-time-data-within-1-to-5-minutes}

- **설명**: 업무상 항상 최신 버전의 데이터가 필요합니다.
- **문제점**: 비동기 구체화된 뷰에는 데이터 지연이 있습니다.

#### 매우 작은 원본 테이블 {#very-small-source-tables}

- **설명**: 기본 테이블에 레코드가 적습니다(예: 수백 행).
- **문제점**: 비동기 구체화된 뷰의 최적화 효과가 크지 않습니다.

---

## 2. 사용 원칙 {#2-usage-principles}

<!-- Knowledge type: principles and constraints -->

### 2.1 비동기 구체화된 뷰를 사용하는 경우 {#21-when-to-use-async-materialized-views}

| 측면 | 설명 |
| --- | --- |
| 적시성 | 데이터 적시성 요구가 높지 않은 시나리오(예: T+1 데이터)에 적합합니다. 적시성 요구가 높다면 동기 구체화된 뷰를 사용하세요. |
| 가속과 일관성 | 자주 사용하는 쿼리 SQL 패턴을 그룹으로 묶되, 그룹 간 중복을 최대한 줄이세요. 그룹 구분이 명확할수록 구축 품질이 높아집니다. |
| 재사용성 | 하나의 쿼리에서 여러 구체화된 뷰를 사용할 수 있고, 하나의 구체화된 뷰를 여러 쿼리에서 사용할 수 있습니다. |
| 절충 사항 | 구체화된 뷰가 사용될 때의 응답 시간(가속 효과), 구축 비용, 데이터 일관성 요구 사항을 함께 고려하세요. |

### 2.2 구체화된 뷰 정의와 구축 비용 간의 절충 {#22-trade-off-between-materialized-view-definition-and-build-cost}

- **원본 쿼리에 가까운 정의**: 가속 효과는 크지만 범용성과 재사용성이 낮고 구축 비용이 높습니다.
- **더 범용적인 정의**(예: WHERE 조건이 없거나 집계 차원이 더 많은 경우): 가속 효과는 낮지만 범용성과 재사용성이 높고 구축 비용이 낮습니다.

:::caution 참고

- **구체화된 뷰 수 관리**: 구체화된 뷰는 많다고 항상 좋은 것은 아닙니다. 구축과 새로 고침에 리소스가 소모되며, 투명 재작성 과정에서 CBO가 최적의 구체화된 뷰를 선택하는 데도 시간이 걸립니다. 이론적으로 구체화된 뷰가 많을수록 투명 재작성 시간이 길어집니다.
- **사용 현황의 주기적 검토**: 사용하지 않는 구체화된 뷰는 제때 삭제해야 합니다.
- **기본 테이블 갱신 빈도**: 기본 테이블이 자주 갱신되면 구체화된 뷰가 자주 무효화되어 투명 재작성에 사용할 수 없게 됩니다(직접 쿼리는 여전히 가능합니다). 이 시나리오에서 투명 재작성을 사용하려면 조회하는 데이터에 어느 정도 지연을 허용해야 하며, 이는 `grace_period`로 설정할 수 있습니다. 자세한 내용은 `grace_period` 설명을 참조하세요.

:::

---

## 3. 새로 고침 전략 선택 {#3-refresh-strategy-selection}

<!-- Knowledge type: decision guide -->

비동기 구체화된 뷰에서는 계산 단위와 트리거 방식을 각각 선택해야 합니다. 계산 단위에는 `INCREMENTAL`, `PARTITIONS`, `COMPLETE`, `AUTO`가 있으며, 트리거 방식에는 수동 새로 고침, 예약 새로 고침, 트리거 기반 새로 고침이 있습니다.

| 계산 단위 | 권장 시나리오 |
|---|---|
| `INCREMENTAL` | 변경된 행 수가 전체 테이블이나 영향을 받는 파티션의 행 수보다 훨씬 적고, 뷰 정의가 IVM 요구 사항을 충족하는 경우 |
| `PARTITIONS` | 변경이 소수의 파티션에 집중되고, 해당 파티션을 다시 계산하는 비용을 감당할 수 있는 경우 |
| `COMPLETE` | 데이터 양이 적거나, 초기 기준 데이터를 구축하거나, 기준 데이터를 복구하는 경우 |
| `AUTO` | Doris가 사용 가능한 방식을 자동으로 선택하도록 하려는 경우 |

IVM은 Doris 5.0.0부터 사용할 수 있으며 현재 실험적 기능입니다. 선택 지침, 사전 요구 사항, 제한 사항은 [Incremental View Maintenance (IVM)](incremental-materialized-view)를 참조하세요.

### 3.1 파티션 구체화된 뷰 우선 고려 {#31-prefer-partitioned-materialized-views}

다음 조건을 모두 충족하면 파티션 구체화된 뷰를 구축하는 것이 좋습니다.

1. 구체화된 뷰의 기본 테이블에 데이터가 많고, 기본 테이블이 파티션 테이블입니다.
2. 구체화된 뷰에서 참조하는 비파티션 테이블이 자주 변경되지 않습니다.
3. 구체화된 뷰 정의 SQL과 파티션 필드가 파티션 도출 요구 사항을 충족합니다(즉, 파티션 증분 갱신 요구 사항을 충족합니다). 자세한 요구 사항은 [CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)를 참조하세요.
4. 구체화된 뷰의 파티션 수가 많지 않습니다. 파티션이 너무 많으면 구축 시간이 지나치게 길어집니다.

> 구체화된 뷰의 일부 파티션이 무효화되더라도, 투명 재작성은 유효한 파티션과 기본 테이블을 UNION ALL로 결합하여 데이터를 반환할 수 있습니다.

파티션 구체화된 뷰를 구축할 수 없다면 **전체 새로 고침**을 사용하는 구체화된 뷰를 고려하세요.

### 3.2 세 가지 새로 고침 전략 비교 {#32-comparison-of-the-three-refresh-strategies}

| 새로 고침 전략 | 트리거 방식 | 데이터 최신성 | 자동화 수준 | 주요 위험 |
|---|---|---|---|---|
| 수동 새로 고침 | 명시적인 사용자 명령 또는 외부 스케줄링 | 낮음, 스케줄링에 따라 달라짐 | 낮음 | 스케줄링을 직접 관리해야 함 |
| 예약 새로 고침 | 고정된 시간 간격(최소 분 단위) | 중간, 지연 시간을 예측할 수 있음 | 중간 | 빈도가 높으면 리소스를 지속적으로 점유함 |
| 트리거 기반 새로 고침 | 기본 테이블 데이터 변경 시 자동으로 트리거 | 높음 | 높음 | 새로 고침이 폭주할 수 있음 |

### 3.3 새로 고침 전략 상세 {#33-detailed-refresh-strategies}

#### 수동 새로 고침 {#manual-refresh}

- **작동 방식**: 사용자가 명시적인 명령이나 외부 시스템 스케줄링을 통해 트리거합니다.
- **적용 시나리오**:
    - 실시간 요구가 낮은 보고 시스템
    - 데이터 웨어하우스의 과거 데이터 분석
    - 특정 업무 프로세스와 동기화하여 새로 고침해야 하는 시나리오
    - 시스템 리소스를 조율해야 하는 대규모 데이터 새로 고침
- **장점**: 새로 고침 시점을 완전히 제어할 수 있어 업무 피크 시간을 피할 수 있습니다.
- **단점**: 새로 고침 스케줄링을 별도로 관리해야 하며, 외부 루프가 새로 고침을 계속 트리거하지 않도록 충분한 내결함성을 갖춰야 합니다.

#### 예약 새로 고침 {#scheduled-refresh}

- **작동 방식**:
    - 고정된 시간 간격으로 자동 새로 고침
    - 최소 시간 단위는 분 단위
    - 작업이 처음 실행되는 시작 시점을 지정할 수 있음
- **적용 시나리오**:
    - 주기적인 업무 지표 모니터링
    - 계층형 데이터 파이프라인
    - 계층마다 적시성 요구가 다른 보고 시스템
    - 규칙적으로 변동하는 원본 데이터
- **장점**: 정해진 일정에 따라 데이터를 처리하며 데이터 지연 시간을 예측할 수 있습니다.
- **단점**: 데이터 최신성에 한계가 있으며, 관련 뷰의 새로 고침 순서를 수동으로 조율해야 합니다.
- **설정 제약 사항**: 실시간에 가깝게 처리하려고 모든 구체화된 뷰를 빈도가 높은 예약 새로 고침으로 설정하는 것은 권장하지 않습니다. 다음 문제가 발생하기 때문입니다.
    - 시스템 리소스의 지속적인 점유
    - 새로 고침 작업 간 리소스 경합
    - 파티션 / 태블릿의 빈번한 추가와 삭제로 인한 BE의 높은 부담

#### 트리거 기반 새로 고침 {#trigger-based-refresh}

- **작동 방식**: 기본 테이블 데이터가 변경되면 새로 고침을 자동으로 트리거합니다.
- **적용 시나리오**:
    - 다계층 구체화된 뷰 아키텍처의 상위 계층 뷰
    - 기본 테이블의 변경 빈도가 낮은 시나리오
- **장점**: 데이터 최신성과 자동화 수준이 높습니다.
- **단점**: 새로 고침이 폭주할 수 있으며 시스템 부하를 예측하기 어렵습니다.
- **설정 제약 사항**: 기본 계층의 구체화된 뷰에서는 다음 조건을 충족하지 않는 한 트리거 기반 새로 고침을 권장하지 않습니다.
    - 기본 테이블의 새로 고침 빈도가 낮다는 것을 확인할 수 있음(예: 수십 분마다 변경)

### 3.4 새로 고침 전략 조합 권장 사항 {#34-recommendations-for-combining-refresh-strategies}

#### 데이터 웨어하우스 계층별 {#by-data-warehouse-layer}

| 뷰 계층 | 권장 새로 고침 전략 |
|---|---|
| 기본 계층 | 예약 새로 고침(예: 매시간) |
| 중간 계층 | 예약 새로 고침 또는 트리거 기반 새로 고침 |
| 표현 계층 | 트리거 기반 새로 고침 또는 수동 새로 고침 |

#### 업무 중요도별 {#by-business-criticality}

| 업무 수준 | 권장 전략 |
|---|---|
| 중요한 실시간 업무 데이터 | 비동기 구체화된 뷰를 권장하지 않음 |
| 일반 분석 데이터 | 예약 새로 고침(매일 / 매시간) |
| 과거 / 보관 데이터 | 수동 새로 고침 |

#### 데이터 변경 빈도별 {#by-data-change-frequency}

| 변경 빈도 | 권장 전략 |
|---|---|
| 빈번한 변경 | 예약 새로 고침(긴 간격) 또는 수동 새로 고침 |
| 드문 변경 | 트리거 기반 새로 고침 또는 짧은 간격의 예약 새로 고침 |
| 일괄 변경 | 변경 후 수동 새로 고침 |

### 3.5 새로 고침 주기 권장 사항 {#35-refresh-frequency-recommendations}

다음은 일반적인 권장 사항입니다. 실제 선택 시에는 시스템 리소스, 비동기 구체화된 뷰 수, 다른 업무의 리소스 사용량도 함께 평가해야 합니다.

| 실제 새로 고침 소요 시간 | 권장 새로 고침 주기 |
|---|---|
| 15초 미만 | 5분 이상 |
| 10분 미만 | 1시간 이상 |
| 1시간 미만 | 1일 이상 |

---

## 4. 파티션 구체화된 뷰 구현 {#4-partitioned-materialized-view-practice}

<!-- Applicable scenarios: large partitioned base tables -->

### 4.1 파티션 매핑 관계 {#41-partition-mapping-relationship}

구체화된 뷰의 파티션은 기본 테이블 파티션을 매핑하여 생성되며, 일반적으로 기본 테이블 파티션과 1:1 또는 1:n 관계를 가집니다. 자세한 파티션 도출 요구 사항은 [CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)와 [비동기 구체화된 뷰 FAQ Q12](../../../query-acceleration/materialized-view/async-materialized-view/faq#q12-error-when-building-a-partition-materialized-view)를 참조하세요.

### 4.2 파티션 무효화와 새로 고침 동작 {#42-partition-invalidation-and-refresh-behavior}

| 트리거 | 영향 | 대응 |
| --- | --- | --- |
| 기본 테이블 파티션 데이터 변경(삽입, 삭제 등) | 해당 구체화된 뷰 파티션이 무효화됩니다. 무효화된 파티션은 투명 재작성에 사용할 수 없지만 직접 쿼리할 수는 있습니다. 투명 재작성 시 무효화된 파티션은 기본 테이블과 함께 쿼리에 응답합니다 | `SHOW PARTITIONS FROM mv_name`으로 파티션 상태 확인 |
| 참조하는 비파티션 테이블의 데이터 변경 | 구체화된 뷰의 모든 파티션이 무효화되며, 투명 재작성에 사용할 수 없게 됩니다 | `REFRESH MATERIALIZED VIEW mv1 AUTO;`를 실행하여 데이터가 변경된 모든 파티션 새로 고침 |
| 참조하는 비파티션 테이블에서 데이터를 삽입만 하고 수정하지 않음 | 기본적으로 모든 파티션이 무효화됩니다 | 생성 시 `excluded_trigger_tables = 'non_partitioned_table_name1,non_partitioned_table_name2'`를 지정합니다. 다음 새로 고침에서는 파티션 테이블에 대응하는 무효화된 파티션만 새로 고침합니다 |

> **설계 권장 사항**: 데이터가 자주 변경되는 테이블은 파티션 구체화된 뷰가 참조하는 파티션 테이블 위치에 배치하고, 변경이 드문 차원 테이블은 파티션 참조 대상이 아닌 위치에 배치하세요.

### 4.3 파티션 단위 투명 재작성 {#43-partition-granularity-transparent-rewrite}

파티션 구체화된 뷰의 투명 재작성은 **파티션 단위**로 작동합니다.

- 구체화된 뷰의 일부 파티션이 무효화되더라도 투명 재작성에 사용할 수 있습니다.
- 다만 쿼리가 하나의 파티션만 대상으로 하고 해당 파티션이 무효화되었다면, 이 투명 재작성에는 구체화된 뷰를 사용할 수 없습니다.

### 4.4 전체 예제 {#44-complete-example}

**목표**: 일별로 집계하는 쿼리를 가속하기 위해 일 단위의 파티션 구체화된 뷰를 구축합니다.

**단계 1**: 일별로 파티션이 나뉜 기본 테이블 `lineitem`을 생성하고 차원 테이블 `partsupp`를 준비합니다.

```sql
CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey INTEGER NOT NULL, 
    l_partkey INTEGER NOT NULL, 
    l_suppkey INTEGER NOT NULL, 
    l_linenumber INTEGER NOT NULL, 
    l_ordertime DATETIME NOT NULL, 
    l_quantity DECIMALV3(15, 2) NOT NULL, 
    l_extendedprice DECIMALV3(15, 2) NOT NULL, 
    l_discount DECIMALV3(15, 2) NOT NULL, 
    l_tax DECIMALV3(15, 2) NOT NULL, 
    l_returnflag CHAR(1) NOT NULL, 
    l_linestatus CHAR(1) NOT NULL, 
    l_shipdate DATE NOT NULL, 
    l_commitdate DATE NOT NULL, 
    l_receiptdate DATE NOT NULL, 
    l_shipinstruct CHAR(25) NOT NULL, 
    l_shipmode CHAR(10) NOT NULL, 
    l_comment VARCHAR(44) NOT NULL
) DUPLICATE KEY(
    l_orderkey, l_partkey, l_suppkey, 
    l_linenumber
) PARTITION BY RANGE(l_ordertime) (
    FROM 
      ('2024-05-01') TO ('2024-06-30') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;

INSERT INTO lineitem VALUES      
(1, 2, 3, 4, '2024-05-01 01:45:05', 5.5, 6.5, 0.1, 8.5, 'o', 'k', '2024-05-01', '2024-05-01', '2024-05-01', 'a', 'b', 'yyyyyyyyy'),    
(1, 2, 3, 4, '2024-05-15 02:35:05', 5.5, 6.5, 0.15, 8.5, 'o', 'k', '2024-05-15', '2024-05-15', '2024-05-15', 'a', 'b', 'yyyyyyyyy'),     
(2, 2, 3, 5, '2024-05-25 08:30:06', 5.5, 6.5, 0.2, 8.5, 'o', 'k', '2024-05-25', '2024-05-25', '2024-05-25', 'a', 'b', 'yyyyyyyyy'),     
(3, 4, 3, 6, '2024-06-02 09:25:07', 5.5, 6.5, 0.3, 8.5, 'o', 'k', '2024-06-02', '2024-06-02', '2024-06-02', 'a', 'b', 'yyyyyyyyy');

CREATE TABLE IF NOT EXISTS partsupp (
    ps_partkey INTEGER NOT NULL, 
    ps_suppkey INTEGER NOT NULL, 
    ps_availqty INTEGER NOT NULL, 
    ps_supplycost DECIMALV3(15, 2) NOT NULL, 
    ps_comment VARCHAR(199) NOT NULL
)
DUPLICATE KEY(ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH(ps_partkey) BUCKETS 3;

INSERT INTO partsupp VALUES     
(2, 3, 9, 10.01, 'supply1'),     
(4, 3, 9, 10.01, 'supply2'),     
(5, 6, 9, 10.01, 'supply3'),     
(6, 5, 10, 11.01, 'supply4');
```

**단계 2**: 일별로 집계하는 일반적인 쿼리입니다.

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  AND l_suppkey = ps_suppkey 
WHERE 
  date_trunc(l_ordertime, 'day') <= DATE '2024-05-25' 
  AND date_trunc(l_ordertime, 'day') >= DATE '2024-05-05' 
GROUP BY 
  l_linestatus, 
  ps_partkey;
```

**단계 3**: 기본 테이블과 동일한 파티션 단위를 사용하고 데이터를 일별로 집계하는, 일별 파티션 구체화된 뷰를 구축합니다.

```sql
CREATE MATERIALIZED VIEW rollup_partition_mv 
BUILD IMMEDIATE REFRESH AUTO ON MANUAL 
partition by(order_date) 
DISTRIBUTED BY RANDOM BUCKETS 2 
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day') AS order_date 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  AND l_suppkey = ps_suppkey 
GROUP BY 
  l_linestatus, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day');
```

### 4.5 최신 파티션 데이터만 유지 {#45-retain-only-the-most-recent-partition-data}

:::tip 팁
이 기능은 Apache Doris 2.1.1부터 지원됩니다.
:::

구체화된 뷰는 최근 몇 개 파티션의 데이터만 유지하고, 새로 고침할 때마다 만료된 파티션 데이터를 자동으로 삭제할 수 있습니다. 다음 속성으로 설정합니다.

| 속성 | 설명 |
| --- | --- |
| `partition_sync_limit` | 기본 테이블의 파티션 필드가 시간 유형일 때 기본 테이블에서 동기화할 파티션 범위를 설정합니다(`partition_sync_time_unit`과 함께 사용). 예를 들어 값을 `3`, 단위를 `DAY`로 설정하면 기본 테이블에서 최근 3일간의 파티션과 데이터만 동기화합니다 |
| `partition_sync_time_unit` | 파티션 새로 고침의 시간 단위입니다. `DAY` / `MONTH` / `YEAR`를 지원하며 기본값은 `DAY`입니다 |
| `partition_date_format` | 기본 테이블의 파티션 필드가 문자열일 때 `partition_sync_limit` 기능을 사용하기 위해 필요한 날짜 형식입니다 |

아래 구체화된 뷰는 최근 3일간의 데이터만 유지합니다. 최근 3일간 데이터가 없다면 구체화된 뷰를 직접 쿼리해도 데이터가 반환되지 않습니다.

```sql
CREATE MATERIALIZED VIEW latest_partition_mv 
BUILD IMMEDIATE REFRESH AUTO ON MANUAL 
partition by(order_date) 
DISTRIBUTED BY RANDOM BUCKETS 2 
PROPERTIES (
  "partition_sync_limit" = "3", 
  "partition_sync_time_unit" = "DAY", 
  "partition_date_format" = "yyyy-MM-dd"
)       
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day') AS order_date 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  AND l_suppkey = ps_suppkey 
GROUP BY 
  l_linestatus, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day');
```

---

## 5. 구체화된 뷰로 쿼리를 가속하는 방법 {#5-how-to-use-materialized-views-to-accelerate-queries}

<!-- Knowledge type: operational guide -->

### 5.1 일반적인 접근 방법 {#51-general-approach}

구체화된 뷰로 쿼리를 가속하려면 다음 단계를 따르세요.

1. 프로파일 파일을 확인하여 쿼리에서 시간이 가장 오래 걸리는 연산을 찾습니다. 병목은 주로 Join, Aggregate, Filter 또는 계산식에서 발생합니다.
2. 병목 연산자를 대상으로 구체화된 뷰를 구축합니다. 예를 들어 Join이 많은 컴퓨팅 리소스를 사용하고 Aggregate는 상대적으로 적게 사용한다면, Join을 대상으로 구체화된 뷰를 구축하세요.

### 5.2 네 가지 연산 유형별 구축 권장 사항 {#52-build-recommendations-for-the-four-operation-types}

#### 5.2.1 Join의 경우 {#521-for-join}

- 쿼리에서 공통으로 사용하는 테이블 조인 패턴을 추출하여 구체화된 뷰를 구축합니다. 이 뷰가 사용되면 Join 연산을 생략할 수 있습니다.
- 더 범용적인 Join 구체화된 뷰를 얻으려면 **쿼리에서 필터를 제거하세요**.

#### 5.2.2 Aggregate의 경우 {#522-for-aggregate}

- 집계 후 데이터 크기를 최소화하려면 **카디널리티가 낮은 필드**를 구체화된 뷰의 차원으로 사용하세요.
- 구체화된 뷰의 집계 단위는 쿼리보다 세분화되어야 합니다(즉, 구체화된 뷰의 집계 차원에 쿼리의 집계 차원이 포함되어야 합니다). 구체화된 뷰의 집계 함수에도 쿼리의 집계 함수가 포함되어야 합니다.

**카디널리티 평가 예제**:

- 테이블 `t1`에 1,000,000개의 행이 있고, 쿼리에 `GROUP BY a, b, c`가 포함되어 있습니다.
    - a, b, c의 카디널리티가 각각 100, 50, 15라면 집계 결과는 약 75,000행입니다. **구체화된 뷰가 효과적입니다**.
    - a, b, c 사이에 상관관계가 있다면 집계 후 데이터 크기는 더 줄어듭니다.
    - c의 카디널리티가 3,500이라면 집계 결과는 약 17,000,000행으로 원본 테이블보다 커집니다. **구체화된 뷰가 적합하지 않습니다**.

#### 5.2.3 Filter의 경우 {#523-for-filter}

- 쿼리가 같은 필드로 자주 필터링한다면 구체화된 뷰에 해당 필터를 추가하여 데이터 크기를 줄이세요.
- **구체화된 뷰의 필터는 쿼리의 필터보다 제한이 적어야 하며**, 쿼리의 필터에는 구체화된 뷰의 필터가 포함되어야 합니다.

예를 들어 쿼리의 필터가 `a > 10 AND b > 5`라면 다음과 같이 구성할 수 있습니다.

- 구체화된 뷰에 필터를 전혀 두지 않거나,
- `a > 5 AND b > 5` 또는 `a > 5`처럼 범위가 더 넓은 필터를 둡니다.

#### 5.2.4 계산식의 경우 {#524-for-calculated-expressions}

- `CASE WHEN`이나 문자열 처리처럼 비용이 높은 식을 미리 계산하면 쿼리 성능을 크게 높일 수 있습니다.
- 하나의 구체화된 뷰에 열이 너무 많아서는 안 됩니다. 쿼리 SQL 패턴별로 그룹을 나누고 각 그룹에 별도의 구체화된 뷰를 구축하세요.

**집계 쿼리 가속 전체 예제**:

쿼리 1:

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_partkey;
```

쿼리 2:

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_suppkey;
```

위 쿼리에는 더 범용적인 집계 구체화된 뷰를 구축합니다. 집계 차원에 `l_partkey`와 `l_suppkey`를 모두 포함하고, `o_orderdate`를 필터 조건으로 사용합니다. 참고: `o_orderdate`는 구체화된 뷰의 조건 보상에 사용될 뿐 아니라 집계 차원에도 포함되어야 합니다. 이렇게 하면 쿼리 1과 쿼리 2 모두 구체화된 뷰를 사용할 수 있습니다.

```sql
CREATE MATERIALIZED VIEW common_agg_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority,
  l_suppkey,
  l_partkey,
  o_orderdate
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_suppkey,
  l_partkey,
  o_orderdate;
```

---

## 6. 대표적인 사용 사례 {#6-typical-use-cases}

<!-- Knowledge type: scenario examples -->

### 6.1 시나리오 1: 쿼리 가속 {#61-scenario-1-query-acceleration}

**적용 시나리오**: BI 보고서처럼 쿼리 응답 시간에 민감하고 초 단위로 결과가 필요한 시나리오입니다. 다중 테이블 Join 후 집계를 수행하면 많은 컴퓨팅 리소스가 소모되어 적시성을 보장하기 어렵습니다. 비동기 구체화된 뷰는 직접 쿼리와 투명 재작성을 모두 지원합니다. 옵티마이저는 재작성 알고리즘과 비용 모델에 따라 최적의 구체화된 뷰를 자동으로 선택합니다.

#### 사용 사례 1: 다중 테이블 조인 집계 쿼리 가속 {#use-case-1-multi-table-join-aggregation-query-acceleration}

더 범용적인 구체화된 뷰를 구축하여 다중 테이블 조인 집계 쿼리를 가속합니다.

**목표**: 아래 세 쿼리를 모두 충족하는 구체화된 뷰 하나를 구축합니다.

쿼리 1:

```sql
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01';
```

쿼리 2:

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```

쿼리 3:

```sql
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**구축 방안 1**: 범용 Join 구체화된 뷰입니다. 쿼리 1과 쿼리 2의 필터 조건을 제거하고 `l_extendedprice * (1 - l_discount)`를 미리 계산합니다.

```sql
CREATE MATERIALIZED VIEW common_join_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS 
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**구축 방안 2**: 위 구체화된 뷰가 쿼리 2의 가속 성능 요구 사항을 충족하지 못한다면 집계 구체화된 뷰를 추가로 구축합니다. 범용성을 유지하려면 `o_orderdate`에 대한 필터를 제거하세요.

```sql
CREATE MATERIALIZED VIEW target_agg_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```

#### 사용 사례 2: 로그 쿼리 가속 {#use-case-2-log-query-acceleration}

**적용 시나리오**: 기본 테이블은 일반적으로 시간별로 파티션이 나뉘며, 쿼리는 주로 시간과 식별 플래그로 필터링하는 단일 테이블 집계입니다. 응답 속도가 만족스럽지 않다면 **비동기 구체화된 뷰와 동기 구체화된 뷰를 함께 사용할 수 있습니다**.

**단계 1**: 기본 테이블 정의입니다.

```sql
CREATE TABLE IF NOT EXISTS test (
`app_name` VARCHAR(64) NULL COMMENT 'identifier', 
`event_id` VARCHAR(128) NULL COMMENT 'identifier', 
`decision` VARCHAR(32) NULL COMMENT 'enum value', 
`time` DATETIME NULL COMMENT 'query time', 
`id` VARCHAR(35) NOT NULL COMMENT 'id', 
`code` VARCHAR(64) NULL COMMENT 'identifier', 
`event_type` VARCHAR(32) NULL COMMENT 'event type' 
)
DUPLICATE KEY(app_name, event_id)
PARTITION BY RANGE(time)                                    
(                                                                                                                                      
    FROM ("2024-07-01 00:00:00") TO ("2024-07-15 00:00:00") INTERVAL 1 HOUR                                                                     
)     
DISTRIBUTED BY HASH(event_id)
BUCKETS 3;
```

**단계 2**: 분 단위로 집계하는 구체화된 뷰를 구축하여 일정 수준의 집계 효과를 얻습니다.

```sql
CREATE MATERIALIZED VIEW sync_mv
AS
SELECT 
  decision,
  code, 
  app_name, 
  event_id, 
  event_type, 
  date_trunc(time, 'minute'), 
  DATE_FORMAT(
    `time`, '%Y-%m-%d'
  ), 
  cast(FLOOR(MINUTE(time) / 15) AS decimal(9, 0)),
  count(id) AS cnt
FROM 
  test 
GROUP BY 
  code, 
  app_name, 
  event_id, 
  event_type, 
  date_trunc(time, 'minute'), 
  decision, 
  DATE_FORMAT(time, '%Y-%m-%d'), 
  cast(FLOOR(MINUTE(`time`) / 15) AS decimal(9, 0));
```

**단계 3**: 일반적인 쿼리입니다.

```sql
SELECT 
    decision, 
    CONCAT(
        CONCAT(
          DATE_FORMAT(
            `time`, '%Y-%m-%d'
          ), 
          '', 
          LPAD(
            cast(FLOOR(MINUTE(`time`) / 15) AS decimal(9, 0)) * 15, 
            5, 
            '00'
          ), 
          ':00'
        )
      ) AS time, 
      count(id) AS cnt 
FROM 
  test 
WHERE 
  date_trunc(time, 'minute') BETWEEN '2024-07-02 18:00:00' 
  AND '2024-07-03 20:00:00' 
GROUP BY 
  decision, 
  DATE_FORMAT(
    `time`, "%Y-%m-%d"
  ), 
  cast(FLOOR(MINUTE(`time`) / 15) AS decimal(9, 0));
```

### 6.2 시나리오 2: 데이터 모델링(ETL) {#62-scenario-2-data-modeling-etl}

**적용 시나리오**: 데이터 분석에는 여러 테이블의 조인과 집계가 필요한 경우가 많으며, 복잡하고 반복적인 쿼리는 높은 지연과 많은 리소스 사용을 초래합니다. 비동기 구체화된 뷰를 사용하여 계층형 데이터 모델을 구축하세요. 기존 구체화된 뷰 위에 상위 계층의 구체화된 뷰를 구축할 수 있습니다(2.1.3부터 지원).

**계층별 트리거 방식 선택**:

- 첫 번째 계층은 예약 새로 고침 + 두 번째 계층은 트리거 새로 고침: 첫 번째 계층의 새로 고침이 완료되면 두 번째 계층이 자동으로 트리거됩니다.
- 모든 계층에서 예약 새로 고침 사용: 두 번째 계층이 새로 고침할 때 첫 번째 계층이 기본 테이블과 동기화되어 있는지는 고려하지 않으며, 첫 번째 계층의 데이터만 처리하여 두 번째 계층으로 동기화합니다.

다음 예제에서는 TPC-H 데이터셋을 사용하여 월별 지역 및 국가별 주문 수와 이익을 분석합니다.

**원본 쿼리(구체화된 뷰 미사용)**:

```sql
SELECT
n_name,
date_trunc(o.o_orderdate, 'month') AS month,
count(distinct o.o_orderkey) AS order_count,
sum(l.l_extendedprice * (1 - l.l_discount)) AS revenue
FROM orders o
JOIN lineitem l ON o.o_orderkey = l.l_orderkey
JOIN customer c ON o.o_custkey = c.c_custkey
JOIN nation n ON c.c_nationkey = n.n_nationkey
JOIN region r ON n.n_regionkey = r.r_regionkey
GROUP BY n_name, month;
```

**단계 1**: DWD 계층(상세 데이터), 즉 주문 상세 와이드 테이블을 구축합니다.

```sql
CREATE MATERIALIZED VIEW dwd_order_detail
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
o.o_orderkey,
o.o_custkey,
o.o_orderstatus,
o.o_totalprice,
o.o_orderdate,
c.c_name,
c.c_nationkey,
n.n_name AS nation_name,
r.r_name AS region_name,
l.l_partkey,
l.l_quantity,
l.l_extendedprice,
l.l_discount,
l.l_tax
FROM orders o
JOIN customer c ON o.o_custkey = c.c_custkey
JOIN nation n ON c.c_nationkey = n.n_nationkey
JOIN region r ON n.n_regionkey = r.r_regionkey
JOIN lineitem l ON o.o_orderkey = l.l_orderkey;
```

**단계 2**: DWS 계층(요약 데이터), 즉 일별 주문 요약을 구축합니다.

```sql
CREATE MATERIALIZED VIEW dws_daily_sales
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
date_trunc(o_orderdate, 'month') AS month,
nation_name,
region_name,
bitmap_union(to_bitmap(o_orderkey)) AS order_count,
sum(l_extendedprice * (1 - l_discount)) AS net_revenue
FROM dwd_order_detail
GROUP BY
date_trunc(o_orderdate, 'month'),
nation_name,
region_name;
```

**단계 3**: 구체화된 뷰를 사용하여 쿼리를 최적화합니다.

```sql
SELECT
nation_name,
month,
bitmap_union_count(order_count),
sum(net_revenue) AS revenue
FROM dws_daily_sales
GROUP BY nation_name, month;
```

### 6.3 시나리오 3: 레이크하우스 연합 데이터 쿼리 {#63-scenario-3-lakehouse-federated-data-query}

**적용 시나리오**: 현대적인 데이터 아키텍처에서는 스토리지 비용과 쿼리 성능의 균형을 맞추기 위해 레이크하우스 설계를 채택하는 경우가 많습니다. 이 아키텍처에는 두 가지 주요 과제가 있습니다.

- **제한적인 쿼리 성능**: 데이터 레이크를 자주 쿼리하면 네트워크 지연과 타사 서비스의 영향을 받아 쿼리 지연이 발생합니다.
- **복잡한 데이터 계층 모델링**: 데이터 레이크의 데이터를 실시간 데이터 웨어하우스로 이동하고 변환하려면 일반적으로 복잡한 ETL이 필요하며 유지 관리 비용도 높습니다.

**Doris 비동기 구체화된 뷰가 이러한 문제를 해결하는 방법**:

- **투명 재작성을 통한 쿼리 가속**: 자주 사용하는 데이터 레이크 쿼리 결과를 Doris 내부 스토리지에 구체화하고, 투명 재작성을 사용하여 쿼리 성능을 높입니다.
- **계층 모델링 간소화**: 데이터 레이크의 테이블 위에 구체화된 뷰를 생성할 수 있어 데이터 레이크에서 실시간 데이터 웨어하우스로 쉽게 전환할 수 있습니다.

아래 예제에서는 Hive를 사용합니다.

**단계 1**: Hive 기반 Catalog를 생성합니다(TPC-H 데이터셋 사용).

```sql
CREATE CATALOG hive_catalog PROPERTIES (
'type'='hms', -- hive meta store address
'hive.metastore.uris' = 'thrift://172.21.0.1:7004'
);
```

**단계 2**: Hive Catalog를 기반으로 구체화된 뷰를 생성합니다.

```sql
-- Materialized views can only be created on the internal catalog. Switch to the internal catalog
SWITCH internal;
CREATE DATABASE hive_mv_db;
USE hive_mv_db;

CREATE MATERIALIZED VIEW external_hive_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 12
AS
SELECT
n_name,
o_orderdate,
sum(l_extendedprice * (1 - l_discount)) AS revenue
FROM
customer,
orders,
lineitem,
supplier,
nation,
region
WHERE
c_custkey = o_custkey
AND l_orderkey = o_orderkey
AND l_suppkey = s_suppkey
AND c_nationkey = s_nationkey
AND s_nationkey = n_nationkey
AND n_regionkey = r_regionkey
AND r_name = 'ASIA'
GROUP BY
n_name,
o_orderdate;
```

**단계 3**: 쿼리를 실행하면 구체화된 뷰를 사용하는 투명 재작성을 통해 자동으로 가속됩니다.

```sql
SELECT
n_name,
sum(l_extendedprice * (1 - l_discount)) AS revenue
FROM
customer,
orders,
lineitem,
supplier,
nation,
region
WHERE
c_custkey = o_custkey
AND l_orderkey = o_orderkey
AND l_suppkey = s_suppkey
AND c_nationkey = s_nationkey
AND s_nationkey = n_nationkey
AND n_regionkey = r_regionkey
AND r_name = 'ASIA'
AND o_orderdate >= DATE '1994-01-01'
AND o_orderdate < DATE '1994-01-01' + INTERVAL '1' YEAR
GROUP BY
n_name
ORDER BY
revenue DESC;
```

:::tip 팁

현재 Doris는 Hive 이외의 외부 테이블에서 발생하는 데이터 변경을 감지할 수 없습니다. 외부 테이블 데이터가 일관되지 않은 상태에서 구체화된 뷰를 사용하면 일관되지 않은 데이터가 반환될 수 있습니다.

**외부 테이블 투명 재작성 스위치**(기본값 `false`): 투명 재작성에 참여하는 구체화된 뷰에 외부 테이블이 포함되는 것을 허용할지 설정합니다. 데이터 불일치를 허용할 수 있거나 예약 새로 고침으로 일관성을 보장할 수 있다면 활성화하세요.

```sql
SET materialized_view_rewrite_enable_contain_external_table = true;
```

**재작성이 선택되지 않을 때의 문제 해결**: 구체화된 뷰의 상태가 `MaterializedViewRewriteSuccessButNotChose`라면 재작성에는 성공했지만 CBO가 해당 실행 계획을 선택하지 않은 것입니다. 외부 테이블 통계가 불완전하기 때문일 수 있습니다.

파일에서 행 수를 가져오는 기능을 활성화하세요.

```sql
SET enable_get_row_count_from_file_list = true;
```

외부 테이블 통계를 확인하여 수집이 완료되었는지 확인하세요.

```sql
SHOW TABLE STATS external_table_name;
```

:::

### 6.4 시나리오 4: 쓰기 효율 향상과 리소스 경합 감소 {#64-scenario-4-improve-write-efficiency-and-reduce-resource-contention}

**적용 시나리오**: 안정적인 시스템 성능과 효율적인 데이터 처리가 필요한 높은 처리량의 데이터 쓰기 시나리오입니다. 비동기 구체화된 뷰의 유연한 새로 고침 전략을 통해 쓰기 부담을 줄이고 리소스 경합을 피할 수 있습니다.

기본 테이블 데이터가 변경되어도 구체화된 뷰의 새로 고침이 즉시 트리거되지는 않습니다. 새로 고침을 지연하면 리소스 부담을 줄이고 쓰기 작업과의 경합을 피하는 데 도움이 됩니다.

**예제**: 2시간마다 새로 고침하는 예약 새로 고침 전략입니다. `orders`와 `lineitem`에 데이터가 적재되어도 구체화된 뷰의 새로 고침이 즉시 트리거되지 않습니다.

```sql
CREATE MATERIALIZED VIEW common_schedule_join_mv
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 2 HOUR
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
l_linestatus,
l_extendedprice * (1 - l_discount),
o_orderdate,
o_shippriority
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

#### 투명 재작성을 통한 데이터 적재 효율 향상 {#transparent-rewrite-improves-load-efficiency}

투명 재작성은 쿼리를 가속할 뿐 아니라 데이터 적재 SQL도 재작성하여 데이터 적재 효율을 높일 수 있습니다. **버전 2.1.6**부터 구체화된 뷰가 기본 테이블과 강한 일관성을 유지하는 경우, DML 작업(예: `INSERT INTO` 또는 `INSERT OVERWRITE`)에 투명 재작성을 적용할 수 있어 데이터 적재 시나리오에서 성능을 크게 높일 수 있습니다.

**단계 1**: `INSERT INTO`로 데이터를 적재할 대상 테이블을 생성합니다.

```sql
CREATE TABLE IF NOT EXISTS target_table  (
orderdate      DATE NOT NULL,
shippriority   INTEGER NOT NULL,
linestatus     CHAR(1) NOT NULL,
sale           DECIMALV3(15,2) NOT NULL
)
DUPLICATE KEY(orderdate, shippriority)
DISTRIBUTED BY HASH(shippriority) BUCKETS 3;
```

**단계 2**: `common_schedule_join_mv` 구체화된 뷰를 생성합니다.

```sql
CREATE MATERIALIZED VIEW common_schedule_join_mv
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 2 HOUR
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
l_linestatus,
l_extendedprice * (1 - l_discount),
o_orderdate,
o_shippriority
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**단계 3**: 재작성 전의 데이터 적재 구문입니다.

```sql
INSERT INTO target_table
SELECT
o_orderdate,
o_shippriority,
l_linestatus,
l_extendedprice * (1 - l_discount)
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**단계 4**: 투명 재작성 후의 동등한 구문입니다.

```sql
INSERT INTO target_table
SELECT *
FROM common_schedule_join_mv;
```

:::caution 참고

데이터 변경을 감지할 수 없는 외부 테이블을 대상으로 DML을 수행하는 경우, 투명 재작성으로 인해 기본 테이블의 최신 데이터가 대상 테이블에 실시간으로 적재되지 않을 수 있습니다. 데이터 불일치를 허용할 수 있거나 직접 일관성을 보장할 수 있다면 다음 스위치를 활성화할 수 있습니다.

DML에서 구체화된 뷰에 데이터 변경을 실시간으로 감지할 수 없는 외부 테이블이 포함되어 있을 때, 구체화된 뷰의 구조 기반 투명 재작성을 활성화할지 설정합니다(기본적으로 비활성화).

```sql
SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;
```

:::

---

## 7. 운영 시 고려 사항 {#7-operational-considerations}

<!-- Knowledge type: operational recommendations -->

비동기 구체화된 뷰는 본질적으로 향상된 ETL 연산이며 지속적인 유지 관리가 필요합니다. 일상적인 운영에서는 다음 세 가지가 핵심입니다.

1. **모니터링**: 구체화된 뷰가 실행되기 시작하면 [메트릭](../../../admin-manual/maint-monitor/metrics.md)을 통해 시스템 상태를 제때 모니터링하세요. 비동기 구체화된 뷰는 향후 더 많은 모니터링 메트릭을 제공할 예정입니다. 현재는 [tasks](../../../sql-manual/sql-functions/table-valued-functions/tasks.md)를 사용하여 작업 수, 실행 상태, 작업 소요 시간 등의 정보를 확인할 수 있습니다.
2. **계획**: 구체화된 뷰 수, 새로 고침 주기, 클러스터의 최대 컴퓨팅 용량을 계획하세요. "구체화된 뷰를 구축만 하고 유지 관리하지 않는" 방식은 피하세요. 구체화된 뷰는 본질적으로 향상된 ETL 연산이며 기존 ETL과 마찬가지로 유지 관리가 필요합니다.
3. **리소스 격리**: 구체화된 뷰는 데이터 연산 작업이므로 필요에 따라 리소스 격리를 적용하세요.

---

## 자주 묻는 질문 {#faq}

**Q1: 비동기 구체화된 뷰가 실시간 쿼리를 완전히 대체할 수 있나요?**

아니요. 비동기 구체화된 뷰에는 트리거 방식, 대기 시간, 새로 고침 시간에 따른 데이터 지연이 있습니다. IVM은 빈번한 소규모 배치 변경의 계산 비용을 줄이지만 실시간 일관성을 제공하지는 않습니다. 적시성 요구가 높은 시나리오에서는 동기 구체화된 뷰를 고려하세요.

**Q2: 실시간에 가깝게 처리하려고 모든 구체화된 뷰를 빈도가 높은 예약 새로 고침으로 설정해도 되나요?**

권장하지 않습니다. 시스템 리소스가 지속적으로 점유되고, 새로 고침 작업 간에 경합이 발생하며, 파티션 / 태블릿이 자주 추가되고 삭제되어 BE에 큰 부담을 줍니다.

**Q3: 새로 고침 전략은 어떻게 선택하나요?**

먼저 계산 단위를 선택한 다음 트리거 방식을 선택하세요. 변경된 행 수가 영향을 받는 파티션의 행 수보다 훨씬 적다면 [IVM](incremental-materialized-view)을 검토하고, 변경이 소수의 파티션에 집중된다면 먼저 [파티션 구체화된 뷰](#31-prefer-partitioned-materialized-views)를 검토하세요. 트리거 방식은 [세 가지 새로 고침 전략 비교](#32-comparison-of-the-three-refresh-strategies)와 [새로 고침 전략 조합 권장 사항](#34-recommendations-for-combining-refresh-strategies)을 참조하세요.

**Q4: 구체화된 뷰를 구축한 후에도 유지 관리가 필요한가요?**

예. 구체화된 뷰는 본질적으로 향상된 ETL 연산이며 모니터링, 계획, 리소스 격리가 필요합니다. 자세한 내용은 [운영 시 고려 사항](#7-operational-considerations)을 참조하세요.

**Q5: 기본 테이블이 자주 갱신되어도 투명 재작성을 사용할 수 있나요?**

기본 테이블이 자주 갱신되면 구체화된 뷰가 자주 무효화되어 투명 재작성에 사용할 수 없게 됩니다(직접 쿼리는 여전히 가능합니다). 이 시나리오에서 투명 재작성을 사용하려면 조회하는 데이터에 어느 정도 지연을 허용해야 하며, 이는 `grace_period`로 설정할 수 있습니다.
