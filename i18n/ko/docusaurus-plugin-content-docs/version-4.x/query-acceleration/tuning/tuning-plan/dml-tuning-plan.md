---
{
    "title": "DML 실행 계획 튜닝: 데이터 적재 및 쿼리 성능 병목 지점 파악",
    "sidebar_label": "DML 실행 계획 튜닝",
    "language": "ko",
    "description": "Doris DML 실행 계획은 어떻게 튜닝할까요? 이 문서에서는 데이터 적재 병목과 쿼리 병목을 구분하는 방법을 설명하고, 데이터 적재 및 쿼리 튜닝의 모범 사례를 확인할 수 있는 자료를 안내합니다.",
    "keywords": ["Doris DML 튜닝", "데이터 적재 성능 병목", "쿼리 성능 병목", "DML 실행 계획 튜닝", "Doris 데이터 적재 모범 사례"]
}
---

<!-- Knowledge type: concept + operational guide -->
<!-- Applicable scenario: performance tuning of DML (INSERT / UPDATE / DELETE / load) execution plans -->

## 튜닝 전 점검 사항 {#pre-tuning-checklist}

DML 실행 계획 튜닝을 시작하기 전에 다음 사항을 확인하세요.

-   **데이터 적재 단계**와 **쿼리 단계**에서 소요되는 시간을 명확히 구분할 수 있는지 확인합니다.
-   Profile / Query Plan을 검토하여 실행 시간이 가장 긴 연산자나 단계를 파악했는지 확인합니다.
-   [데이터 적재 개요](../../../data-operate/import/load-manual.md)를 읽고 사용 시나리오에 적합한 데이터 적재 방식을 이해했는지 확인합니다.

## 튜닝 대상 파악: 데이터 적재 병목과 쿼리 병목 {#tuning-localization-load-bottleneck-vs-query-bottleneck}

<!-- Knowledge type: methodology -->
<!-- Applicable scenario: initial diagnosis of slow DML SQL -->

DML 문(예: `INSERT INTO ... SELECT`)의 성능 병목은 일반적으로 두 가지 원인에서 비롯됩니다. **먼저 어느 단계에서 병목이 발생하는지 파악한 후**, 그에 맞게 튜닝해야 합니다.

| 병목 유형   | 일반적인 증상                                          | 튜닝 참고 자료                                                                                                  |
| :---------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| 데이터 적재 단계 병목  | 쓰기 처리량이 낮고 Sink 연산자에서 소요되는 시간이 김       | [데이터 적재 개요](../../../data-operate/import/load-manual.md)를 참조하여 적절한 데이터 적재 방식과 모범 사례 선택 |
| 쿼리 단계 병목 | Scan, Join, 집계 등의 연산자에서 소요되는 시간이 김 | [실행 계획 튜닝](optimizing-table-schema.md)의 다른 섹션을 참조하여 진단 및 튜닝                            |

## 데이터 적재 측 튜닝 {#load-side-tuning}

<!-- Knowledge type: practical guide -->
<!-- Applicable scenario: efficient loading of the data source in DML -->

Doris는 다양한 데이터 소스에서 데이터를 적재할 수 있도록 지원합니다. Doris가 제공하는 데이터 적재 기능을 유연하게 활용하면 여러 소스의 데이터를 Doris로 효율적으로 가져와 분석할 수 있습니다.

-   **목표**: 데이터 소스와 적시성 요구 사항에 맞는 데이터 적재 방식을 선택하여 전반적인 DML 성능을 개선합니다.
-   **참고 자료**: [데이터 적재 개요](../../../data-operate/import/load-manual.md).
-   **참고**: 데이터 적재 방식에는 Stream Load, Broker Load, Routine Load, INSERT 등이 있습니다. 자세한 모범 사례는 위 링크를 참조하세요.

## 쿼리 측 튜닝 {#query-side-tuning}

<!-- Knowledge type: practical guide -->
<!-- Applicable scenario: tuning the SELECT clause or query execution plan within DML -->

쿼리 단계에서 병목이 발생한다면 실행 계획 튜닝의 다른 섹션을 따라 진단하고 최적화하세요. 예를 들어 테이블 스키마 최적화, 통계, 조인 순서, 연산자 재작성 등을 살펴볼 수 있습니다. 자세한 내용은 [실행 계획 튜닝](optimizing-table-schema.md)을 참조하세요.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: frequently asked questions -->
<!-- Applicable scenario: common questions during DML tuning -->

**질문1: DML 문이 느릴 때 데이터 적재 단계와 쿼리 단계 중 어디에서 지연이 발생하는지 빠르게 구분하려면 어떻게 해야 하나요?**
Profile에서 각 연산자의 소요 시간을 확인하세요. Sink/Load 관련 연산자의 소요 시간이 길면 데이터 적재 측에 병목이 있습니다. Scan/Join/Agg 연산자의 소요 시간이 길면 쿼리 측에 병목이 있습니다.

**질문2: `INSERT INTO ... SELECT`가 느릴 때 어느 부분을 먼저 살펴봐야 하나요?**
먼저 SELECT 하위 쿼리가 느린지 확인하세요. SELECT만 단독으로 실행했을 때 빠르다면 병목은 대개 쓰기 측에 있습니다.

**질문3: 모든 데이터 적재 방식을 같은 방법으로 튜닝해야 하나요?**
아니요. 데이터 적재 방식(Stream Load, Broker Load, Routine Load, INSERT 등)에 따라 튜닝 방법이 다릅니다. [데이터 적재 개요](../../../data-operate/import/load-manual.md)를 참조하세요.
