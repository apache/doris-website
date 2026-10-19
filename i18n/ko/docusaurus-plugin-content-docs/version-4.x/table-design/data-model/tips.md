---
{
    "title": "테이블 모델 모범 사례",
    "language": "ko",
    "description": "Doris 데이터 모델 선택 권장 사항, 테이블 생성 시 열 유형 규칙, Aggregate 모델의 count(*) 제한 사항, Unique 모델의 merge-on-write 최적화, Key 열의 의미 차이에 대한 상세 설명."
}
---

<!-- Knowledge type: Architecture selection decision + Configuration parameters + Performance tuning -->
<!-- Applicable scenarios: Model selection before table creation / Understanding data models / count(*) performance optimization -->

이 문서에서는 모델 선택, 테이블 스키마 설계, 모델의 제한 사항이라는 관점에서 Doris 데이터 모델을 사용할 때 주의해야 할 사항을 설명합니다. 적합한 모델을 선택하고 흔히 발생하는 성능 문제를 피하는 데 도움이 됩니다.

## 데이터 모델 선택 권장 사항 {#data-model-selection-recommendations}

데이터 모델은 테이블 생성 시 결정되며 **수정할 수 없습니다**. 따라서 적합한 데이터 모델을 선택하는 것이 매우 중요합니다.

### 세 가지 모델 비교 {#comparison-of-the-three-models}

| 데이터 모델 | 적용 시나리오            | 장점                                                                  | 참고 사항                                                                                                       |
| ---------- | ------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Duplicate  | 모든 차원에 대한 애드혹 쿼리 | 집계 모델의 제약을 받지 않으며, 필요한 열만 읽는 열 기반 스토리지의 이점을 최대한 활용 | 사전 집계를 활용할 수 없음(단, 비동기 구체화된 뷰를 통해 지원 가능)                     |
| Unique     | 기본 키의 고유성과 데이터 업데이트가 필요한 경우 | 기본 키의 고유성을 보장하고 유연한 업데이트 지원                | 사전 집계를 활용할 수 없음(단, 비동기 구체화된 뷰를 통해 지원 가능)                     |
| Aggregate  | 패턴이 고정된 보고서 쿼리 | 사전 집계로 쿼리 시 스캔하고 계산하는 데이터양을 크게 줄임 | `count(*)` 쿼리에 비효율적이며, 선언된 집계 유형과 다른 집계 쿼리를 실행할 때 의미적 정확성에 주의해야 함 |

### 부분 열 업데이트 요구 사항 {#partial-column-update-requirements}

업무상 부분 열 업데이트가 필요하다면 다음 문서에서 사용 권장 사항을 확인하세요.

- [Unique 모델의 부분 열 업데이트](../../data-operate/update/update-of-unique-model)
- [Aggregate 모델의 부분 열 업데이트](../../data-operate/update/update-of-aggregate-model)

## 테이블 생성 시 열 유형 권장 사항 {#recommendations-for-column-types-when-creating-tables}

<!-- Knowledge type: Configuration parameters -->

테이블을 생성할 때 열 유형과 순서에 대해 다음 규칙을 따르세요.

1. **열 순서**: Key 열은 모든 Value 열보다 앞에 와야 합니다.
2. **정수형 우선 사용**: 정수 연산과 조회는 문자열보다 훨씬 효율적이므로 가능하면 정수형을 사용하세요.
3. **요구 사항을 충족하는 가장 작은 정수 길이 사용**: 길이가 다른 정수형 중에서 선택할 때는 필요한 만큼만 사용한다는 원칙을 따르세요.
4. **요구 사항을 충족하는 가장 작은 가변 길이 문자열 사용**: VARCHAR 및 STRING 유형의 길이에도 필요한 만큼만 사용한다는 동일한 원칙을 적용하세요.

## 모델별 Key 열의 의미 차이 {#semantic-differences-of-key-columns-across-models}

<!-- Knowledge type: Architecture selection decision -->

Duplicate, Aggregate, Unique 모델은 모두 테이블 생성 시 Key 열을 지정하지만, 그 의미는 서로 다릅니다.

| 모델              | Key 열의 역할                                       |
| ------------------ | ------------------------------------------------------------- |
| Duplicate          | "정렬 열"로만 사용되며, 고유 식별 기능은 제공하지 않음 |
| Aggregate, Unique  | "정렬 열"과 "고유 식별 열"의 역할을 모두 수행하며, 진정한 의미의 Key 열에 해당함 |

## Aggregate 모델의 제한 사항 {#limitations-of-the-aggregate-model}

<!-- Knowledge type: Performance tuning -->
<!-- Applicable scenarios: Performance troubleshooting / count(*) query optimization -->

Aggregate 모델은 최종 집계된 데이터를 외부에 제공합니다. 즉, **아직 집계되지 않은 모든 데이터**(예: 서로 다른 두 데이터 적재 배치에 속한 데이터)는 외부에 제공하기 전에 특정 메커니즘을 통해 일관성을 확보해야 합니다.

### 일관성 보장 예시 {#example-of-consistency-guarantees}

다음과 같은 테이블 스키마가 있다고 가정합니다.

| 열 이름 | 유형     | 집계 유형 | 설명       |
| ---------- | -------- | --------------- | ------------- |
| user_id    | LARGEINT |                 | 사용자 ID       |
| date       | DATE     |                 | 데이터 적재 날짜 |
| cost       | BIGINT   | SUM             | 사용자 총 지출액 |

스토리지 엔진에는 이미 두 데이터 적재 배치의 데이터가 저장되어 있습니다.

**배치 1**

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 50   |
| 10002   | 2017/11/21 | 39   |

**배치 2**

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 1    |
| 10001   | 2017/11/21 | 5    |
| 10003   | 2017/11/22 | 22   |

위에서 볼 수 있듯이, 두 데이터 적재 배치에 걸쳐 있는 사용자 10001의 데이터는 아직 집계되지 않았습니다. 사용자에게는 아래와 같이 최종 집계된 데이터만 보여야 합니다.

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 51   |
| 10001   | 2017/11/21 | 5    |
| 10002   | 2017/11/21 | 39   |
| 10003   | 2017/11/22 | 22   |

이를 위해 Doris는 쿼리 엔진에 집계 연산자를 추가하여 외부에 제공하는 데이터의 일관성을 보장합니다.

### 집계 유형이 일치하지 않는 쿼리의 의미적 함정 {#semantic-pitfall-of-inconsistent-aggregation-queries}

Value 열에 대해 **선언된 유형과 다른 집계 유형**으로 집계 쿼리를 실행할 때는 의미에 주의해야 합니다. 예를 들면 다음과 같습니다.

```sql
SELECT MIN(cost) FROM table;
```

결과는 `5`이며, `1`이 아닙니다.

### count(*) 쿼리 오버헤드 {#count-query-overhead}

Aggregate 모델의 일관성 보장 메커니즘은 특정 쿼리의 효율을 크게 떨어뜨립니다. 가장 대표적인 사례는 `count(*)` 쿼리입니다.

```sql
SELECT COUNT(*) FROM table;
```

다른 데이터베이스에서는 이러한 쿼리가 매우 빠르게 결과를 반환합니다. "데이터 적재 중 행 수를 세어 통계로 저장"하거나 "쿼리 시 열 하나만 스캔하여 개수를 계산"하는 방식으로 아주 적은 오버헤드만으로 결과를 얻을 수 있습니다. 하지만 Doris의 Aggregate 모델에서는 이 쿼리의 비용이 매우 큽니다.

앞서 살펴본 데이터를 예로 들면, 최종 집계 결과는 다음과 같습니다.

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 51   |
| 10001   | 2017/11/21 | 5    |
| 10002   | 2017/11/21 | 39   |
| 10003   | 2017/11/22 | 22   |

`SELECT COUNT(*) FROM table;`의 올바른 결과는 `4`여야 합니다. 하지만 다음과 같은 문제가 있습니다.

- `user_id` 열만 스캔하고 쿼리 시점에 집계하면 `3`(10001, 10002, 10003)이 반환되므로 올바르지 않습니다.
- `user_id` 열만 스캔하고 쿼리 시점에 집계하지 않으면 `5`(두 배치에 걸쳐 총 5행)가 반환되므로 올바르지 않습니다.

올바른 결과를 얻으려면 **`user_id` 열과 `date` 열을 모두 읽고**, 쿼리 시점에 집계해야 올바른 결과인 `4`를 반환할 수 있습니다. 즉, `count(*)` 쿼리에서 *Doris는 의미적으로 올바른 결과를 얻기 위해 모든 AGGREGATE KEY 열(여기서는 `user_id`와 `date`)을 스캔하고 집계해야 합니다*. 집계 열이 많으면 `count(*)` 쿼리가 많은 양의 데이터를 스캔해야 합니다.

### count(*) 성능 최적화 {#count-performance-optimization}

워크로드에서 `count(*)` 쿼리를 자주 실행한다면, **값이 항상 1이고 집계 유형이 SUM인** 열을 추가하여 `count(*)`를 대신할 수 있습니다. 앞선 예시의 테이블 스키마를 다음과 같이 수정합니다.

| 열 이름 | 유형   | 집계 유형 | 설명              |
| ---------- | ------ | ------------- | -------------------- |
| user_id    | BIGINT |               | 사용자 ID              |
| date       | DATE   |               | 데이터 적재 날짜       |
| cost       | BIGINT | SUM           | 사용자 총 지출액     |
| count      | BIGINT | SUM           | 개수 계산에 사용 |

데이터를 적재할 때 `count` 열의 값을 상수 1로 설정합니다. 그러면 다음과 같습니다.

```sql
SELECT COUNT(*) FROM table;
-- equivalent to
SELECT SUM(count) FROM table;
```

후자가 전자보다 훨씬 효율적입니다.

**사용 제한 사항**: AGGREGATE KEY 열의 값이 동일한 행이 여러 번 적재되지 않도록 해야 합니다. 그렇지 않으면 `SELECT SUM(count) FROM table;`는 적재한 원본 행의 수만 나타내며, 더 이상 `SELECT COUNT(*) FROM table;`와 동등하지 않습니다.

**대안**: 위의 `count` 열의 집계 유형을 `REPLACE`로 변경하고, 값은 계속 상수 1로 유지합니다. 이 경우 `SELECT SUM(count) FROM table;`와 `SELECT COUNT(*) FROM table;`는 동일한 결과를 반환하며, 중복 행의 데이터 적재에도 제한이 없습니다.

## Unique 모델의 merge-on-write 구현 {#merge-on-write-implementation-of-the-unique-model}

<!-- Knowledge type: Performance tuning -->

Unique 모델의 merge-on-write 구현에는 앞서 설명한 Aggregate 모델의 제한 사항이 없습니다. 앞서 사용한 동일한 데이터를 예로 들면, merge-on-write는 각 데이터 적재의 rowset에 해당하는 delete bitmap을 추가하여 덮어쓴 데이터를 표시합니다.

**첫 번째 배치 적재 후**:

배치 1

| user_id | date       | cost | 삭제 비트 |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017/11/20 | 50   | FALSE      |
| 10002   | 2017/11/21 | 39   | FALSE      |

**두 번째 배치 적재 후**, 첫 번째 배치의 중복 행은 삭제된 것으로 표시됩니다.

배치 1

| user_id | date       | cost | 삭제 비트 |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017/11/20 | 50   | TRUE       |
| 10002   | 2017/11/21 | 39   | FALSE      |

배치 2

| user_id | date       | cost | 삭제 비트 |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017/11/20 | 1    | FALSE      |
| 10001   | 2017/11/21 | 5    | FALSE      |
| 10003   | 2017/11/22 | 22   | FALSE      |

쿼리 시점에는 delete bitmap에서 삭제된 것으로 표시된 모든 행을 필터링하며, **데이터 집계가 필요하지 않습니다**. 위 데이터에는 유효한 행이 4개 있으며, 쿼리 결과도 4행입니다. 따라서 앞서 언급한 "열 하나만 스캔하여 개수를 계산"하는, 오버헤드가 가장 적은 방식을 사용할 수 있습니다.

**성능 데이터**: 테스트 환경에서 Unique 모델의 merge-on-write 구현에 대한 `count(*)` 쿼리는 Aggregate 모델보다 성능이 **10배 넘게** 높습니다.

## Duplicate 모델 {#duplicate-model}

<!-- Knowledge type: Architecture selection decision -->

Duplicate 모델에는 앞서 설명한 Aggregate 모델의 제한 사항이 없습니다. 이 모델에는 집계 의미가 적용되지 않으므로, `count(*)` 쿼리는 **임의의 단일 열**을 스캔하여 의미적으로 올바른 결과를 얻을 수 있습니다.
