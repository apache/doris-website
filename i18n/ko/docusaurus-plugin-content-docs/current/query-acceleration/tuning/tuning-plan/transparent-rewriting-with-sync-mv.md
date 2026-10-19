---
{
    "title": "동기식 구체화된 뷰를 활용한 투명한 쿼리 재작성",
    "language": "ko",
    "description": "Doris의 동기식 구체화된 뷰로 투명한 쿼리 재작성을 활성화하고 상세 데이터 테이블의 고정 차원 집계 쿼리를 가속화하는 방법을 알아봅니다. 생성 절차, 적중 여부 확인, 권장 사항을 설명합니다.",
    "keywords": ["Doris 동기식 구체화된 뷰", "투명한 쿼리 재작성", "쿼리 가속화", "동기식 구체화된 뷰", "집계 쿼리 최적화", "구체화된 뷰 적중"]
}
---

<!-- Knowledge type: concept + how-to guide -->
<!-- Applicable scenario: performance tuning for fixed-dimension aggregation queries on detail tables -->

[동기식 구체화된 뷰](../../materialized-view/sync-materialized-view.md)(Sync-Materialized View)는 미리 정의된 SELECT 문의 결과를 저장하는 사전 계산 테이블입니다. 원본 상세 데이터에 대한 임의 차원 분석을 지원하면서 고정 차원의 집계 쿼리도 가속화합니다.

쿼리를 실행할 때 Doris는 **최적의 구체화된 뷰를 자동으로 찾아** 해당 뷰에서 데이터를 직접 읽습니다. 이 모든 과정은 사용자가 인지할 필요 없이 이루어지며, 이를 "투명한 쿼리 재작성"이라고 합니다. 기본 테이블의 데이터가 변경되면 Doris가 구체화된 뷰의 일관성을 자동으로 유지하므로 수동으로 개입할 필요가 없습니다.

### 사전 요구 사항 {#prerequisites}

- Doris 2.0 이상 버전이 배포되어 있어야 합니다.
- 상세 데이터를 저장하는 기본 테이블이 이미 존재하고, 해당 테이블에 대해 고정된 집계 쿼리를 반복적으로 실행하고 있어야 합니다.
- 구체화된 뷰를 생성하는 데 필요한 데이터베이스 및 테이블 권한이 있어야 합니다.
- 운영 환경에 적용하기 전에 적중 동작을 검증할 수 있는 테스트 환경이 있어야 합니다.

### 적용 시나리오 {#applicable-scenarios}

<!-- Knowledge type: selection decision -->
<!-- Applicable scenario: deciding whether to use a sync materialized view -->

| 시나리오 유형 | 주요 특징 |
| --- | --- |
| 상세 데이터와 고정 차원 집계의 공존 | 상세 데이터와 고정된 집계 결과를 모두 조회해야 함 |
| 열 / 행 가지치기 | 쿼리가 테이블의 열이나 행 중 일부만 접근함 |
| 시간이 오래 걸리는 연산자 | 쿼리에 장시간 실행되는 집계 등 부하가 큰 연산이 포함됨 |
| 서로 다른 접두사 인덱스 | 필터링을 가속화하기 위해 서로 다른 접두사 인덱스가 필요함 |

> 한 줄 정의: 동기식 구체화된 뷰 = 일관성이 자동으로 유지되는 사전 집계 테이블 + 최적의 뷰를 자동으로 찾는 투명한 쿼리 재작성.

:::tip 참고 사항
- Doris 2.0 이상 버전에서는 구체화된 뷰 기능이 강화되었습니다. 운영 환경에 적용하기 전에 대상 쿼리가 예상한 구체화된 뷰에 적중하는지 테스트 환경에서 검증하세요.
- 동일한 테이블에 구조가 비슷한 구체화된 뷰를 여러 개 생성하지 마세요. 뷰끼리 충돌하여 적중에 실패할 수 있습니다.
:::

## 사례: 매장별 매출 집계 {#case-aggregating-sales-by-store}

<!-- Knowledge type: hands-on example -->
<!-- Applicable scenario: create a sync materialized view from scratch and verify transparent rewriting -->

각 판매 건의 거래 ID, 판매 담당자 ID, 매장 ID, 판매일, 거래 금액을 기록하는 매출 상세 테이블 `sales_records`가 있다고 가정해 보겠습니다. 매장별 매출액 집계는 일반적인 분석 요구 사항입니다.

다음 단계에서는 `store_amt` 구체화된 뷰를 생성하여 `store_id`별로 그룹화하고 매출액을 합산한 뒤, 쿼리가 이 뷰를 사용하도록 투명하게 재작성되는지 확인합니다.

### 1단계: 동기식 구체화된 뷰 생성 {#step-1-create-the-sync-materialized-view}

- **목표**: 매장별로 집계하는 쿼리의 결과를 미리 계산합니다.
- **명령**:

    ```sql
    CREATE MATERIALIZED VIEW store_amt AS
    SELECT store_id, SUM(sale_amt)
    FROM sales_records
    GROUP BY store_id;
    ```

- **참고 사항**: 명령을 제출하면 Doris가 백그라운드에서 구체화된 뷰를 비동기적으로 구축하므로 서비스 쿼리를 차단하지 않습니다.

### 2단계: 구축 진행 상황 확인 {#step-2-check-the-build-progress}

- **목표**: 구체화된 뷰의 구축이 완료되었는지 확인합니다.
- **명령**:

    ```sql
    SHOW ALTER TABLE MATERIALIZED VIEW FROM db_name;
    ```

- **참고 사항**: `State` 필드가 `FINISHED`로 바뀌면 `store_amt`가 성공적으로 생성되어 쿼리가 적중할 수 있는 상태가 됩니다.

### 3단계: 투명한 쿼리 재작성 실행 {#step-3-trigger-transparent-rewriting}

- **목표**: 집계 구조가 일치하는 쿼리가 구체화된 뷰를 자동으로 사용하도록 합니다.
- **명령**:

    ```sql
    SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
    ```

- **참고 사항**: Doris는 `store_amt`가 쿼리에 적합한지 자동으로 판단하고 사전 집계된 데이터를 직접 읽으므로 SQL을 변경할 필요가 없습니다.

### 4단계: 구체화된 뷰 적중 여부 확인 {#step-4-verify-the-materialized-view-is-hit}

- **목표**: 투명한 쿼리 재작성이 적용되었는지 확인합니다.
- **명령**:

    ```sql
    EXPLAIN SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
    ```

- **참고 사항**: 실행 계획의 끝부분을 확인하세요. 다음 내용이 표시되면 `store_amt`에 적중한 것입니다.

    ```text
    TABLE: default_cluster:test.sales_records(store_amt), PREAGGREGATION: ON
    ```

## 투명한 쿼리 재작성과 기본 테이블 직접 조회 비교 {#transparent-rewriting-vs-querying-the-base-table-directly}

<!-- Knowledge type: comparison table -->
<!-- Applicable scenario: evaluate whether introducing a sync materialized view is worthwhile -->

| 비교 항목 | 기본 테이블 직접 조회 | 동기식 구체화된 뷰를 사용하도록 투명하게 쿼리 재작성 |
| --- | --- | --- |
| 데이터 소스 | 상세 데이터를 대상으로 실행 시점에 계산 | 사전 집계된 결과를 직접 읽음 |
| 집계 쿼리 성능 | 데이터 양의 영향을 크게 받음 | 크게 향상됨 |
| SQL 재작성 비용 | 없음 | 없음(자동으로 적합한 뷰 선택) |
| 데이터 일관성 | 기본적으로 일관성 유지 | Doris가 자동으로 유지 |
| 유지 관리 비용 | 없음 | 충돌을 방지하도록 뷰 구조를 설계해야 함 |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ / Troubleshooting -->
<!-- Applicable scenario: troubleshoot issues such as materialized view misses, slow builds, and conflicts -->

### 쿼리가 구체화된 뷰에 적중하지 않는 이유는 무엇인가요? {#why-is-my-query-not-hitting-the-materialized-view}

일반적인 원인은 다음과 같습니다.

1. 구체화된 뷰를 아직 구축 중이며, `State`가 아직 `FINISHED`로 바뀌지 않았습니다.
2. 쿼리의 열, 집계 함수 또는 그룹화 키가 구체화된 뷰 정의와 일치하지 않습니다.
3. 동일한 기본 테이블에 구조가 비슷한 구체화된 뷰가 여러 개 있어 충돌이 발생하고, 이로 인해 재작성에 실패합니다.

확인 방법: `EXPLAIN`을 사용하여 실행 계획 끝부분의 `TABLE: ...(materialized view name)` 정보를 살펴보고, 실제로 어떤 테이블에 적중하는지 확인하세요.

### 구체화된 뷰의 구축 상태는 어떻게 확인하나요? {#how-do-i-check-the-materialized-view-build-status}

`SHOW ALTER TABLE MATERIALIZED VIEW FROM db_name;`를 실행하고 `State` 필드를 확인하세요.

- `PENDING` / `RUNNING`: 구축이 진행 중입니다.
- `FINISHED`: 구축이 완료되어 쿼리가 뷰에 적중할 수 있습니다.
- `CANCELLED`: 구축에 실패했거나 취소되었습니다. 원인을 조사하고 뷰를 다시 생성하세요.

### 하나의 기본 테이블에 구체화된 뷰를 여러 개 생성할 수 있나요? {#can-i-create-multiple-materialized-views-on-a-single-base-table}

가능하지만 **비슷한 구조는 피하세요**. 비슷한 뷰가 여러 개 있으면 투명한 쿼리 재작성 과정에서 최적의 뷰를 선택하지 못해 적중에 실패할 수 있습니다. 먼저 테스트 환경에서 쿼리가 예상한 뷰에 적중하는지 검증하세요.

### 구체화된 뷰의 데이터를 수동으로 동기화해야 하나요? {#do-i-need-to-manually-sync-data-to-the-materialized-view}

아니요. 기본 테이블의 데이터가 변경되면 Doris가 구체화된 뷰의 일관성을 자동으로 유지합니다.

## 요약 {#summary}

<!-- Knowledge type: key takeaways -->
<!-- Applicable scenario: quickly recap the key conclusions of this article -->

- 동기식 구체화된 뷰 = 사전 집계 테이블 + 자동 일관성 유지 + 투명한 쿼리 재작성.
- 상세 데이터 쿼리와 고정 차원 집계가 공존하는 시나리오에 적합합니다.
- 생성 후에는 `EXPLAIN`을 사용하여 적중 여부를 확인하고 비슷한 뷰 간의 충돌을 방지하세요.
- 운영 환경에 적용하기 전에 테스트 환경에서 대상 쿼리의 적중 동작을 검증하세요.
