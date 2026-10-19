---
{
    "title": "인덱스 최적화: 접두사 인덱스와 역색인 활용 팁",
    "sidebar_label": "인덱스 최적화",
    "language": "ko",
    "description": "Doris의 접두사 인덱스와 역색인으로 쿼리를 어떻게 가속할 수 있을까요? 이 문서에서는 대표적인 시나리오를 바탕으로 Key 컬럼 순서, 보조 인덱스 선택 및 최적화에 대한 권장 사항을 설명합니다.",
    "keywords": ["Doris 인덱스 최적화", "접두사 인덱스", "역색인", "ZoneMap", "Bloomfilter", "쿼리 가속", "Key 컬럼 순서"]
}
---

<!-- Knowledge type: concept + operation + case -->
<!-- Applicable scenarios: Doris query performance tuning, index design and selection -->

## 개요 {#overview}

<!-- Knowledge type: concept -->
<!-- Applicable scenarios: understand the full picture of the Doris index system -->

Doris 인덱스는 쿼리 필터링을 가속하는 데 사용하는 데이터 구조입니다. 인덱스를 적절히 활용하면 쿼리 성능을 크게 높일 수 있습니다.

Doris는 현재 두 가지 범주의 인덱스를 지원합니다.

| 인덱스 범주       | 포함되는 유형                                                            | 특징                                                       |
| ----------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| 내장 인덱스       | 접두사 인덱스, ZoneMap 인덱스                                             | 테이블 생성 시 자동으로 생성되며 별도의 관리가 필요하지 않음 |
| 보조 인덱스       | 역색인, Bloomfilter 인덱스, N-Gram Bloomfilter 인덱스, Bitmap 인덱스        | 사용자가 필요에 따라 생성하며 독립적으로 관리할 수 있음    |

업무 성능을 최적화할 때 업무 특성에 맞게 인덱스를 효과적으로 활용하면 쿼리 및 분석 성능을 크게 높일 수 있습니다. 이는 성능 튜닝의 핵심 기법 중 하나입니다.

각 인덱스 유형에 대한 자세한 설명은 [테이블 인덱스](../../../table-design/index/index-overview.md) 장을 참고하세요. 이 문서에서는 실제 사례를 바탕으로 몇 가지 대표적인 시나리오에서 인덱스를 활용하는 팁과 최적화 권장 사항을 소개합니다.

### 읽기 전 자가 점검 목록 {#pre-reading-self-check-checklist}

- 현재 테이블의 Key 컬럼 정의와 순서를 이해하고 있습니다.
- 업무에서 자주 사용하는 필터 필드를 파악했습니다.
- 테이블을 재구성할 수 있는지, 보조 인덱스만 추가할 수 있는지 검토했습니다.
- 인덱스 유형별로 어떤 상황에 적합한지 이해하고 있습니다.

## 사례 1: Key 컬럼 순서를 조정하여 접두사 인덱스로 쿼리 가속 {#case-1-adjust-key-column-order-to-accelerate-queries-with-prefix-indexes}

<!-- Knowledge type: case + operation -->
<!-- Applicable scenarios: high-frequency filter fields miss the prefix index, leading to slow queries -->

[테이블 스키마 설계 최적화](optimizing-table-schema.md)에서는 적절한 필드를 Key 필드로 선택하고 Doris의 Key 컬럼 정렬 기능을 활용하여 쿼리를 가속하는 방법을 소개했습니다. 이 사례에서는 해당 시나리오를 더 자세히 살펴봅니다.

### 배경 {#background}

Doris에는 접두사 인덱스가 내장되어 있습니다. 테이블 생성 시 테이블 Key의 처음 36바이트를 자동으로 접두사 인덱스로 사용합니다. 쿼리 조건이 접두사 인덱스의 접두사와 일치하면 쿼리 속도를 크게 높일 수 있습니다.

### 문제: Key 컬럼 순서가 쿼리 패턴과 맞지 않음 {#problem-key-column-order-does-not-match-the-query-pattern}

기존 CREATE TABLE 문은 다음과 같습니다.

```sql
CREATE TABLE `t1` (
  `c1` VARCHAR(10) NULL,
  `c2` VARCHAR(10) NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

이에 해당하는 업무 SQL 패턴은 다음과 같습니다.

```sql
select * from t1 where t1.c2 = '1';
select * from t1 where t1.c2 in ('1', '2', '3');
```

위 스키마에서는 `c1`이 앞에 있고 `c2`가 뒤에 있지만, 쿼리는 `c2` 필드를 기준으로 필터링합니다. 이 경우 접두사 인덱스를 활용하여 쿼리를 가속할 수 없습니다.

### 최적화: 컬럼 순서 조정 {#optimization-adjust-column-order}

`c2` 컬럼을 첫 번째 필드 위치에 배치하여 접두사 인덱스가 업무 필터 조건을 포함하도록 합니다.

```sql
CREATE TABLE `t1` (
  `c2` VARCHAR(10) NULL,
  `c1` VARCHAR(10) NULL
) ENGINE=OLAP
DUPLICATE KEY(`c2`)
DISTRIBUTED BY HASH(`c1`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

:::tip 최적화 팁

스키마의 컬럼 순서를 정의할 때는 업무 쿼리 필터에서 자주 사용하고 우선순위가 높은 컬럼을 고려하여 Doris 접두사 인덱스의 가속 기능을 최대한 활용하세요.

:::

## 사례 2: 역색인을 사용하여 쿼리 가속 {#case-2-use-inverted-indexes-to-accelerate-queries}

<!-- Knowledge type: case + operation -->
<!-- Applicable scenarios: table structure is inconvenient to adjust, text retrieval, equality / range queries -->

### 적용 시나리오 {#applicable-scenarios}

Doris는 다음과 같은 업무 시나리오를 가속하기 위해 역색인을 보조 인덱스로 지원합니다.

- 텍스트 타입 필드의 전문 검색
- 문자열, 숫자 또는 날짜/시간 필드의 동등 조건 쿼리
- 문자열, 숫자 또는 날짜/시간 필드의 범위 쿼리

### 장점 {#advantages}

역색인은 독립적으로 생성하고 관리할 수 있습니다. 따라서 기존 테이블 스키마에 영향을 주거나 테이블 데이터를 다시 가져올 필요 없이 업무 성능을 손쉽게 최적화할 수 있습니다.

대표적인 사용 사례, 구문 및 예제는 [역색인](../../../table-design/index/inverted-index/overview)을 참고하세요. 이 절에서는 해당 내용을 반복해서 설명하지 않습니다.

:::tip 최적화 권장 사항

기존 테이블 구조와 Key 정의를 최적화하기 어렵거나 데이터를 다시 가져오는 비용이 큰 경우, 역색인을 활용하면 업무 실행 성능을 유연하게 최적화할 수 있습니다.

:::

## 인덱스 선택 비교 {#index-selection-comparison}

<!-- Knowledge type: comparison -->
<!-- Applicable scenarios: quickly select among multiple indexes -->

| 인덱스 유형           | 적용 가능한 쿼리                  | 테이블 재구성 필요 여부 | 데이터 다시 가져오기 필요 여부 | 대표적인 필드 유형           |
| --------------------- | --------------------------------- | ---------------------- | ---------------------------- | ---------------------------- |
| 접두사 인덱스         | 동등 조건, 범위, 접두사 일치       | 예(Key 조정)           | 예                           | 앞쪽에 정렬된 Key 컬럼       |
| ZoneMap 인덱스        | 범위 필터링                       | 아니요(자동)           | 아니요                       | 모든 컬럼                    |
| 역색인                | 전문 검색, 동등 조건, 범위        | 아니요                 | 아니요                       | 문자열, 숫자, 날짜/시간      |
| Bloomfilter 인덱스    | 카디널리티가 높은 필드의 동등 조건 필터 | 아니요            | 아니요(증분 적용)            | 문자열, 숫자                 |
| N-Gram Bloomfilter    | LIKE 유사 일치                    | 아니요                 | 아니요(증분 적용)            | 문자열                       |
| Bitmap 인덱스         | 카디널리티가 낮은 필드의 동등 조건 필터 | 아니요            | 아니요(증분 적용)            | 열거형 필드                  |

## 자주 묻는 질문과 일반적인 문제 {#faq-and-common-issues}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: common questions and troubleshooting during index usage -->

### Q1: 인덱스를 생성한 후에도 쿼리가 느린 이유는 무엇인가요? {#q1-why-are-my-queries-still-slow-after-creating-an-index}

가능한 원인은 다음과 같습니다.

- 쿼리 조건이 인덱스가 있는 컬럼을 사용하지 않습니다.
- Key 컬럼 순서가 필터 조건과 맞지 않아 접두사 인덱스가 적용되지 않습니다.
- 데이터양이 적어 인덱스의 효과가 두드러지지 않습니다.
- 인덱스가 기존 데이터에 아직 적용되지 않았습니다. 일부 보조 인덱스는 새로 기록되는 데이터에만 즉시 적용됩니다.

### Q2: 접두사 인덱스를 수동으로 생성해야 하나요? {#q2-does-the-prefix-index-need-to-be-created-manually}

아니요. 테이블 생성 시 Doris는 Key 컬럼의 처음 36바이트를 자동으로 접두사 인덱스로 사용합니다. 접두사 인덱스가 효과를 발휘하려면 업무에서 자주 사용하는 필터 필드를 Key 컬럼의 앞쪽에 배치하세요.

### Q3: 역색인과 Bloomfilter 인덱스 중 어떤 것을 선택해야 하나요? {#q3-how-to-choose-between-an-inverted-index-and-a-bloomfilter-index}

- 전문 검색, 유사 일치, 범위 쿼리에는 역색인을 우선 고려하세요.
- 카디널리티가 높은 필드에서 정확한 동등 조건으로 쿼리하는 경우에는 오버헤드가 더 낮은 Bloomfilter 인덱스를 선택하세요.

### Q4: Key 컬럼 순서를 조정하려면 테이블을 재구성해야 하나요? {#q4-does-adjusting-the-key-column-order-require-rebuilding-the-table}

예. Key 컬럼 순서는 테이블 스키마 정의의 일부이므로, 순서를 조정한 후에는 테이블을 재구성하고 데이터를 다시 가져와야 합니다.

## 요약 {#summary}

<!-- Knowledge type: summary -->
<!-- Applicable scenarios: review key points of index tuning -->

스키마 튜닝에서 인덱스 최적화는 테이블 수준의 스키마 최적화만큼 중요합니다. Doris는 다양한 인덱스 유형을 제공합니다.

- 내장 인덱스: 접두사 인덱스, ZoneMap 인덱스
- 보조 인덱스: 역색인, Bloomfilter, N-Gram Bloomfilter, Bitmap

이러한 인덱스를 적절히 활용하면 다양한 시나리오에서 업무 쿼리 및 분석 속도를 크게 높일 수 있습니다. 먼저 업무에서 자주 사용하는 필터 필드를 검토한 다음, 테이블 재구성 가능 여부와 데이터양 등을 고려하여 적절한 인덱스 유형을 선택하는 것이 좋습니다.
