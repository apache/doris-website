---
{
    "title": "Aggregate 모델의 데이터 적재 기반 업데이트",
    "language": "ko",
    "description": "Doris Aggregate Key Model에서 데이터 적재를 통해 행 전체 업데이트와 일부 열 업데이트를 수행하는 방법과 집계 쓰기 동작의 의미를 설명합니다."
}
---

<!-- Knowledge type: Operational guide -->
<!-- Applicable scenario: Data writes into the Aggregate model / Incremental data merging -->

Doris Aggregate Key Model을 사용할 때는 일반적으로 다음과 같은 상황이 발생합니다.

- 집계 테이블에 새 데이터를 계속 쓰면서, 집계 규칙에 따라 새 값을 기존 값과 병합해야 합니다.
- 일부 열만 업데이트하고 나머지 열의 기존 집계 결과는 유지해야 합니다.

이 문서에서는 이러한 상황에 대해 Doris Aggregate 모델이 지원하는 두 가지 업데이트 방식인 **행 전체 업데이트**와 **일부 열 업데이트**를 설명합니다.

## 업데이트 방식 개요 {#overview-of-update-methods}

| 업데이트 방식 | 적용 상황 | 지원하는 데이터 적재 방법 | 동작 |
| --- | --- | --- | --- |
| 행 전체 업데이트 | 행 전체를 쓰고 각 열의 집계 함수에 따라 새 값과 기존 값을 병합 | Stream Load, Broker Load, Routine Load, Insert Into 등 | 집계 함수가 새 값과 기존 값을 결합하여 새로운 집계 값을 생성 |
| 일부 열 업데이트 | 일부 열만 업데이트하고 나머지 열의 기존 집계 결과는 유지 | [일부 열 업데이트](./partial-column-update.md#column-update-on-the-aggregate-key-model) 참조 | 지정한 열만 집계 병합에 참여 |

## 행 전체 업데이트 {#whole-row-update}

<!-- Knowledge type: Behavior description -->

Stream Load, Broker Load, Routine Load, Insert Into 등 Doris에서 지원하는 데이터 적재 방법으로 Aggregate 모델(Agg 모델)에 데이터를 쓰면, 엔진은 각 열에 정의된 집계 함수를 사용하여 새 값을 기존 집계 값과 결합하고 새로운 집계 값을 생성합니다.

집계 값은 다음 시점에 생성될 수 있습니다.

1. **데이터 적재 시점**: 데이터를 쓰는 동안 실시간으로 병합됩니다.
2. **비동기 Compaction 중**: 백그라운드 병합 과정에서 집계가 완료됩니다.

집계 값이 어느 단계에서 생성되든 쿼리 시 사용자에게 반환되는 결과는 동일합니다.

## 일부 열 업데이트 {#partial-column-update}

<!-- Knowledge type: Capability index -->

Aggregate Key Model은 테이블의 일부 열만 업데이트하면서 나머지 열의 기존 집계 결과를 유지하는 기능을 지원합니다. 테이블 생성 방법, 데이터 쓰기 예제, 사용 시 유의 사항은 [일부 열 업데이트](./partial-column-update.md#column-update-on-the-aggregate-key-model) 문서를 참조하세요.
