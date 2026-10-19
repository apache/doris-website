---
title: Condition Cache로 반복 필터 쿼리 가속
sidebar_label: Condition Cache
description: Doris Condition Cache는 Segment 필터 결과를 캐싱하여 반복되는 조건 쿼리를 어떻게 가속할까요? 이 문서에서는 동작 원리, 설정, 적중률 모니터링을 자세히 설명합니다.
keywords:
    - Doris Condition Cache
    - 조건 캐시
    - 쿼리 가속
    - 반복 필터 최적화
    - Segment 필터 캐시
    - LRU 캐시
    - 동시성이 높은 OLAP 쿼리
    - enable_condition_cache
---

<!-- Knowledge type: capability definition / configuration parameter / performance tuning -->
<!-- Applicable scenario: high-frequency repeated condition queries / query performance optimization -->

**Condition Cache**는 Apache Doris에서 반복되는 조건 쿼리를 위해 설계된 쿼리 가속 메커니즘입니다. 특정 Segment에 특정 필터 조건을 적용한 결과를 압축된 비트 벡터로 캐싱합니다. 이후 쿼리가 캐시에 적중하면 이 결과를 바로 재사용할 수 있어 반복적인 스캔과 필터링을 피할 수 있습니다. 이를 통해 CPU 및 IO 오버헤드를 줄이고 쿼리 지연 시간을 단축합니다.

대규모 분석 환경에서는 다음과 같이 쿼리에 동일한 필터 조건이 반복해서 포함되는 경우가 많습니다.

```sql
SELECT * FROM orders WHERE region = 'ASIA';
SELECT count(*) FROM orders WHERE region = 'ASIA';
```

이러한 쿼리는 동일한 데이터 샤드(Segment)에서 같은 필터 로직을 반복 실행하여 **불필요한 CPU 및 IO 오버헤드**를 발생시킵니다. Condition Cache는 필터 결과를 재사용하여 **불필요한 스캔과 필터링을 줄이고**, 쿼리 지연 시간을 크게 단축합니다.

## 동작 원리 {#working-principle}

<!-- Knowledge type: architectural principle -->

Condition Cache의 핵심 아이디어는 **동일한 데이터 샤드에 동일한 필터 조건을 적용하면 같은 결과가 나온다**는 것입니다.

1. Doris는 "필터 표현식 + Key Range"에서 **64비트 다이제스트**를 생성하여 캐시의 고유 식별자로 사용합니다.
2. 각 Segment는 이 다이제스트를 사용하여 캐시에 기존 필터 결과가 있는지 조회할 수 있습니다.
3. 캐시된 결과는 압축된 **비트 벡터(`std::vector<bool>`)**로 저장됩니다.

비트 벡터의 각 값은 다음을 의미합니다.

| 비트 값 | 의미                                                       |
| --------- | ------------------------------------------------------------- |
| `0`       | 해당 행 범위는 조건을 충족하지 않으므로 건너뛸 수 있음 |
| `1`       | 해당 범위에 조건을 충족하는 행이 있을 수 있으므로 추가 스캔이 필요함 |

이 방식으로 Doris는 큰 단위에서 조건을 충족하지 않는 데이터 블록을 빠르게 제외하고, 필요한 경우에만 정밀한 필터링을 수행할 수 있습니다.

## 적용 시나리오 {#applicable-scenarios}

<!-- Knowledge type: architecture selection decision -->

### 권장 시나리오 {#recommended-scenarios}

Condition Cache는 다음 시나리오에서 가장 효과적입니다.

| 시나리오             | 설명                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| **반복되는 조건** | 동일하거나 유사한 필터 조건을 자주 사용함                              |
| **비교적 안정적인 데이터** | Segment 내부의 데이터는 일반적으로 변경되지 않음(INSERT/Compaction은 새로운 Segment를 생성하며, 기존 캐시는 자연스럽게 축출됨) |
| **높은 선택도** | 필터링 후 남는 행이 적어 스캔 감소 효과가 극대화됨  |

### Condition Cache가 적용되지 않는 시나리오 {#scenarios-where-condition-cache-does-not-apply}

다음 시나리오에서는 Condition Cache가 동작하지 않습니다.

- 쿼리에 **Delete 조건**이 포함된 경우(삭제 마커의 정확성을 보장해야 하므로 캐시가 비활성화됩니다).
- 실행 중 생성되는 **TopN Runtime Filter**가 있는 경우(아직 지원되지 않습니다).

## 설정 및 관리 {#configuration-and-management}

<!-- Knowledge type: configuration parameter -->

### 활성화 및 비활성화 {#enable-and-disable}

- **목적**: 세션 수준에서 Condition Cache를 활성화합니다.
- **명령**:

    ```sql
    set enable_condition_cache = true;
    ```

- **설명**: 이 매개변수는 현재 세션에서 Condition Cache를 사용할지 여부를 제어합니다.

### 메모리 관리 {#memory-management}

Condition Cache의 메모리 사용은 다음 규칙을 따릅니다.

| 항목              | 설명                                                          |
| ----------------- | -------------------------------------------------------------------- |
| 축출 정책   | **LRU (Least Recently Used)**, 용량 한도를 초과하면 사용한 지 가장 오래된 항목부터 자동으로 축출함 |
| 용량 매개변수 | `condition_cache_limit`, 단위는 MB, 기본값은 `1024`                       |
| 설정 위치 | `be.conf`                                                       |
| 자연 만료 | Segment가 Compaction을 거친 후 기존 캐시 항목은 LRU에 의해 자연스럽게 축출됨 |

용량 한도 변경 예시:

```properties
# be.conf
condition_cache_limit = 1024
```

## 캐시 통계 및 모니터링 {#cache-statistics-and-monitoring}

<!-- Knowledge type: operational steps -->

Doris는 Condition Cache의 효과를 관찰할 수 있는 다양한 통계 지표를 제공합니다. 이러한 지표로 캐시의 이점과 적중률을 평가할 수 있습니다.

### Profile 수준 지표 {#profile-level-metrics}

쿼리 실행 계획(Profile)에서 다음 지표를 확인할 수 있습니다.

| 지표 이름                    | 의미                          |
| ------------------------------ | -------------------------------- |
| `ConditionCacheSegmentHit`     | 캐시에 적중한 Segment 수 |
| `ConditionCacheFilteredRows`   | 캐시를 통해 바로 걸러낸 행 수 |

### 시스템 지표 {#system-metrics}

모니터링 시스템이나 `metrics` 인터페이스를 통해 다음 지표를 확인할 수 있습니다.

| 지표 이름                     | 의미           |
| ------------------------------- | ----------------- |
| `condition_cache_search_count`  | 캐시 조회 횟수 |
| `condition_cache_hit_count`     | 캐시 적중 횟수   |

## 사용 예시 {#usage-example}

### 일반적인 시나리오 {#typical-scenario}

다음과 같은 쿼리가 있다고 가정하겠습니다.

```sql
SELECT order_id, amount
FROM orders
WHERE region = 'ASIA' AND order_date >= '2023-01-01';
```

실행 흐름:

1. **최초 실행**: 전체 스캔과 조건 평가가 필요합니다. Condition Cache는 결과를 LRU 캐시에 저장합니다.
2. **이후 동일한 쿼리 실행**: 캐시를 바로 사용하여 조건을 충족하지 않는 행 범위 대부분을 건너뛰고, 조건을 충족할 가능성이 있는 부분만 스캔합니다.

여러 쿼리가 동일한 필터 조건(예: `region = 'ASIA' AND order_date >= '2023-01-01'`)을 공유하는 경우에도 쿼리 간에 Condition Cache를 재사용하여 전체 오버헤드를 줄일 수 있습니다.

## 참고 사항 {#notes}

- **캐시는 영구 저장되지 않음**: Doris를 재시작하면 Condition Cache가 비워집니다.
- **Delete 작업 시 캐시 비활성화**: 삭제 마커가 포함된 Segment는 강한 일관성을 보장해야 하므로 Condition Cache를 사용하지 않습니다.

## 자주 묻는 질문 {#faq}

**Q1: Condition Cache와 Query Cache의 차이점은 무엇인가요?**

Condition Cache는 "Segment에서 필터 조건의 충족 여부"를 비트 벡터로 캐싱합니다. 더 세밀한 단위로 동작하며 서로 다른 쿼리 간에도 재사용할 수 있습니다. 쿼리 실행 계층의 최적화 메커니즘입니다.

**Q2: Condition Cache를 활성화해도 쿼리가 빨라지지 않는 이유는 무엇인가요?**

다음 사항을 확인해 볼 수 있습니다.

- 쿼리 조건에 Delete 마커나 TopN Runtime Filter가 포함되어 있어 캐시가 동작하지 않을 수 있습니다.
- 데이터 쓰기가 빈번할 수 있습니다. Compaction 후 기존 Segment가 새로운 Segment로 교체되면 캐시가 축출됩니다.
- 조건의 선택도가 낮아 필터링 후에도 많은 행이 남는 경우 이점이 제한적입니다.
- `condition_cache_hit_count` / `condition_cache_search_count`를 사용하여 적중률이 낮은지 확인합니다.

**Q3: 쿼리가 Condition Cache에 적중했는지 어떻게 확인하나요?**

Profile에서 `ConditionCacheSegmentHit` 및 `ConditionCacheFilteredRows` 지표를 확인합니다. 값이 0보다 크면 캐시에 적중했고 필터링 효과가 있었다는 의미입니다.

**Q4: `condition_cache_limit`을 조정한 후 재시작해야 하나요?**

`condition_cache_limit`은 `be.conf`에 설정합니다. 변경 사항을 적용하려면 BE를 재시작해야 합니다.

## 요약 {#summary}

Condition Cache는 Doris에서 **반복되는 조건 쿼리**를 최적화하는 메커니즘입니다. 장점은 다음과 같습니다.

- 중복 계산을 피하고 CPU/IO 사용량을 줄입니다.
- 사용자의 개입 없이 자동으로 동작합니다.
- 메모리를 적게 사용하며, 적중률과 필터링 비율이 높을 때 효과가 큽니다.

Condition Cache를 잘 활용하면 OLAP 쿼리가 빈번하게 실행되는 환경에서 더 빠른 응답 시간을 확보할 수 있습니다.
