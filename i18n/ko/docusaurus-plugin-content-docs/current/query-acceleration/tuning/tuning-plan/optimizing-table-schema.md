---
{
    "title": "테이블 스키마 설계 최적화: 테이블 모델, 버킷팅 컬럼, Key 컬럼 및 필드 타입 튜닝",
    "sidebar_label": "테이블 스키마 설계 최적화",
    "language": "ko",
    "description": "테이블 모델 선택, 버킷팅 컬럼 설계, Key 컬럼 최적화, 필드 타입 튜닝을 통해 Doris 테이블 스키마를 어떻게 튜닝할 수 있을까요? 이 문서에서는 대표적인 시나리오를 바탕으로 실무에 적용할 수 있는 튜닝 방법을 안내합니다.",
    "keywords": ["Doris 스키마 설계", "Doris 테이블 모델", "버킷팅 컬럼 최적화", "Key 컬럼 최적화", "필드 타입 최적화", "데이터 편향", "Doris 성능 튜닝"]
}
---

<!-- Knowledge type: concept + how-to guide -->
<!-- Applicable scenario: schema design before table creation and query performance tuning -->

테이블 스키마 설계는 Doris 성능 튜닝의 핵심 요소입니다. 데이터 분산, 쿼리 병렬성, 정렬 효율에 직접적인 영향을 미칩니다.

스키마를 적절하게 설계하지 않으면 다음과 같은 문제가 발생하기 쉽습니다.

- 데이터 편향으로 인해 쿼리 병렬성을 충분히 활용하지 못함
- 정렬 특성을 활용하지 못해 동등 조건 쿼리와 범위 쿼리가 느려짐
- 부적절한 필드 타입으로 인해 연산 오버헤드가 증가함

더 자세한 설계 원칙은 [테이블 설계](../../../table-design/overview.mdx) 장을 참조하세요. 이 장에서는 실제 사례를 통해 대표적인 스키마 설계 문제와 권장 튜닝 방법을 살펴봅니다.

### 튜닝 체크리스트 {#tuning-checklist}

테이블 스키마를 설계하거나 문제를 해결할 때는 다음 항목을 순서대로 확인하세요.

- 업무에 맞는 테이블 모델(Duplicate / Unique / Aggregate)을 선택했나요?
- 버킷팅 컬럼이 null 값이나 고정 값으로 인한 편향 없이 해시를 통해 고르게 분산되나요?
- 동등 조건 쿼리와 범위 쿼리에서 자주 사용하는 컬럼을 Key 컬럼으로 정의했나요?
- 필드 타입이 "고정 길이 우선, 낮은 정밀도 우선" 원칙을 따르나요?

## 사례 1: 테이블 모델 선택 {#case-1-table-model-selection}

<!-- Knowledge type: concept comparison -->
<!-- Applicable scenario: model selection before table creation -->

Doris는 Duplicate, Unique(MOR/MOW), Aggregate의 세 가지 테이블 모델을 제공합니다. 각 모델은 쿼리 성능과 기능적 특성이 다릅니다.

### 세 가지 테이블 모델 비교 {#comparison-of-the-three-table-models}

| 테이블 모델        | 쿼리 성능 | 업데이트 지원 | 대표적인 사용 시나리오                                |
| ------------------ | ----------------- | ---------------- | ------------------------------------------------ |
| Duplicate          | 가장 높음           | 미지원               | 로그 및 상세 데이터에 대한 고성능 쿼리 |
| Unique (MOW)       | 높음              | 지원              | 높은 쿼리 성능이 필요한 기본 키 기반 중복 제거 |
| Unique (MOR)       | 보통           | 지원              | 쓰기가 빈번한 기본 키 기반 중복 제거   |
| Aggregate          | 보통           | 집계 업데이트 | 사전 집계 보고서 및 지표 롤업       |

> 성능 순위: Duplicate > MOW > MOR ≈ Aggregate

:::tip 튜닝 권장 사항

데이터 업데이트가 필요하지 않고 높은 쿼리 성능이 필요한 업무에서는 [Duplicate 테이블](../../../table-design/data-model/duplicate.md)을 우선적으로 선택하세요.

:::

## 사례 2: 버킷팅 컬럼 선택 {#case-2-bucketing-column-selection}

<!-- Knowledge type: how-to guide -->
<!-- Applicable scenario: data skew troubleshooting and design before table creation -->

**한 문장으로 보는 정의**: 버킷팅 컬럼은 데이터를 버킷에 분산하는 방식을 결정합니다. 잘못 선택하면 데이터 편향이 발생해 쿼리 성능의 병목이 됩니다.

버킷팅 컬럼을 적절하게 설계하면 다음과 같은 효과를 얻을 수 있습니다.

-   데이터 편향을 방지하고 병렬성을 충분히 활용
-   Colocate Join과 Bucket Shuffle Join의 효과 극대화

### 잘못된 예: null 값이 매우 많은 c2 컬럼 {#bad-example-c2-column-contains-a-large-number-of-nulls}

다음 예에서는 버킷팅 컬럼을 `c2`로 설정했지만, 가져온 데이터의 `c2` 값이 모두 null입니다. 그 결과 64개 버킷 중 1개에 모든 데이터가 집중됩니다.

```sql
CREATE TABLE `t1` (
  `c1` INT NULL,
  `c2` INT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 64
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
insert into t1 select number, null from numbers ('number'='10000000');
```

### 최적화: 카디널리티가 높은 컬럼으로 변경 {#optimization-switch-to-a-column-with-high-cardinality}

버킷팅 컬럼을 `c2`에서 `c1`로 변경하면 데이터가 버킷에 고르게 분산되어 병렬 처리 능력이 향상됩니다.

### 데이터 편향 진단 명령 {#command-for-troubleshooting-data-skew}

**목적**: 버킷팅 컬럼에 데이터 편향이 있는지 확인합니다.
**명령**:

```sql
select c2, count(*) cnt from t1 group by c2 order by cnt desc limit 10;
```

**설명**: 상위 값의 cnt가 다른 값보다 훨씬 크다면 해당 컬럼에는 심각한 편향이 있으므로 버킷팅 컬럼으로 적합하지 않습니다.

### 버킷팅 컬럼 선택 원칙 {#principles-for-bucketing-column-selection}

-   업무 데이터에서 null 값이나 고정 값이 자주 나타나는 컬럼은 피하세요.
-   사용자 ID나 주문 ID처럼 업무 데이터의 카디널리티가 높은 필드를 우선적으로 선택하세요.
-   테이블을 생성하기 전에 필드 값의 분포를 예측하고, 필요한 경우 샘플링으로 검증하세요.

:::tip 튜닝 권장 사항

버킷팅 컬럼에 데이터 편향이 있는지 확인하세요. 편향이 있다면 카디널리티가 더 높은 필드로 교체하세요. 사전에 적절하게 설계하면 이후의 진단 및 수정 비용을 크게 줄일 수 있습니다.

:::

## 사례 3: Key 컬럼 최적화 {#case-3-key-column-optimization}

<!-- Knowledge type: how-to guide -->
<!-- Applicable scenario: equality and range query performance tuning -->

**한 문장으로 보는 정의**: Doris는 스토리지 계층에서 Key 컬럼을 기준으로 데이터를 정렬합니다. 자주 조회하는 컬럼을 Key 컬럼으로 정의하면 동등 조건 쿼리와 범위 쿼리의 속도를 크게 높일 수 있습니다.

### 업무 쿼리 예시 {#business-query-examples}

```sql
select * from t1 where t1.c1 = 1;
select * from t1 where t1.c1 > 1 and t1.c1 < 10;
select * from t1 where t1.c1 in (1, 2, 3);
```

### 최적화: c1을 Key 컬럼으로 정의 {#optimization-define-c1-as-a-key-column}

```sql
CREATE TABLE `t1` (
  `c1` INT NULL,
  `c2` INT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

:::tip 튜닝 권장 사항

업무의 동등 조건 쿼리나 범위 쿼리에서 자주 사용하는 컬럼을 Key 컬럼으로 정의하여 쿼리 처리 속도를 높이세요.

:::

## 사례 4: 필드 타입 최적화 {#case-4-field-type-optimization}

<!-- Knowledge type: principles and best practices -->
<!-- Applicable scenario: table creation and field type refactoring -->

**한 문장으로 보는 정의**: 필드 타입은 연산 복잡도에 직접적인 영향을 미칩니다. 고정 길이 타입과 정밀도가 낮은 타입은 가변 길이 타입과 정밀도가 높은 타입보다 처리 효율이 높습니다.

### 타입 선택 원칙 {#type-selection-principles}

| 원칙             | 권장                                | 지양                              |
| --------------------- | ------------------------------------------ | ---------------------------------- |
| 고정 길이 우선    | INT, BIGINT, DATE, DATETIME                | VARCHAR, STRING                    |
| 낮은 정밀도 우선   | INT, BIGINT, FLOAT                         | DECIMAL(높은 정밀도를 사용하는 경우) |

### 일반적인 타입 교체 시나리오 {#common-replacement-scenarios}

-   숫자 값을 저장하는 VARCHAR / STRING 필드를 BIGINT로 교체
-   불필요한 DECIMAL 필드를 FLOAT / INT / BIGINT로 교체
-   문자열 형식의 시간 필드를 DATETIME으로 교체

:::tip 튜닝 권장 사항

스키마의 타입을 정의할 때는 "고정 길이 우선, 낮은 정밀도 우선" 원칙에 따라 연산 효율과 시스템 성능을 높이세요.

:::

## 자주 묻는 질문 {#frequently-asked-questions}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: common questions during tuning -->

### Q1: 테이블을 생성한 후 버킷팅 컬럼이 적절하지 않다는 것을 알게 되면 어떻게 해야 하나요? {#q1-what-if-i-find-the-bucketing-column-is-unreasonable-after-creating-the-table}

테이블을 생성한 후에는 버킷팅 컬럼을 직접 수정할 수 없습니다. 새 테이블을 생성하고 데이터를 다시 가져오거나, `ALTER TABLE`을 사용하여 새로운 Rollup 또는 파티셔닝 구성을 생성해야 합니다. 테이블을 생성하기 전에 필드의 카디널리티를 충분히 평가하는 것이 좋습니다.

### Q2: Key 컬럼은 많을수록 좋은가요? {#q2-are-more-key-columns-always-better}

아닙니다. Key 컬럼이 너무 많으면 저장 시 정렬 오버헤드와 쓰기 비용이 증가합니다. 동등 조건 필터링이나 범위 필터링에 실제로 자주 사용하는 컬럼만 Key 컬럼으로 설정하세요.

### Q3: Unique 또는 Aggregate 모델을 반드시 사용해야 하는 경우는 언제인가요? {#q3-when-must-i-use-the-unique-or-aggregate-model}

-   기본 키를 기준으로 데이터의 중복을 제거하거나 데이터를 업데이트해야 한다면 Unique를 사용하세요.
-   사전 집계(SUM, MAX, MIN 등)가 필요하다면 Aggregate를 사용하세요.
-   추가만 수행하는 상세 데이터에 대해 매우 높은 쿼리 성능이 필요하다면 Duplicate를 사용하세요.

### Q4: 현재 테이블에 데이터 편향이 있는지 어떻게 확인하나요? {#q4-how-do-i-determine-whether-the-current-table-has-data-skew}

다음 SQL을 실행하여 버킷팅 컬럼의 분포를 확인하세요.

```sql
select <bucket_col>, count(*) cnt from <table> group by <bucket_col> order by cnt desc limit 10;
```

상위 값의 개수가 다른 값보다 훨씬 많다면 편향이 있는 것입니다.

## 요약 {#summary}

스키마를 신중하게 설계하면 Doris의 기능을 최대한 활용하고 쿼리 성능을 크게 높일 수 있습니다. 부적절한 스키마는 데이터 편향과 같이 시스템 전반에 영향을 미치는 문제를 일으킬 수 있습니다.

핵심 튜닝 사항:

-   업데이트가 필요하지 않은 경우 Duplicate 테이블 모델을 우선적으로 선택
-   null 값이나 고정 값을 피하고 카디널리티가 높은 버킷팅 컬럼을 선택
-   자주 조회하는 컬럼을 Key 컬럼으로 정의
-   필드 타입은 "고정 길이 우선, 낮은 정밀도 우선" 원칙을 준수

사전 설계는 사후 튜닝보다 항상 비용이 적게 듭니다. 스키마 설계 단계에서 위 원칙을 철저히 따르는 것이 좋습니다.
