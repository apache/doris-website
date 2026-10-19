---
{
    "title": "Unique 모델의 데이터 적재 기반 업데이트",
    "language": "ko",
    "description": "전체 행 Upsert와 부분 컬럼 업데이트를 지원하는 Stream Load, Routine Load 등의 데이터 적재 방식을 통해 Doris Unique(기본 키) 모델의 데이터를 업데이트하는 방법을 설명합니다."
}
---

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenarios: Data update / Real-time write / Unique model Upsert -->

실시간 데이터 웨어하우스 및 운영 데이터베이스 동기화 시나리오에서 사용자는 다음과 같은 문제를 자주 겪습니다.

- 업무 테이블의 데이터를 기본 키에 따라 지속적으로 업데이트해야 하며(예: 주문 상태 변경이나 사용자 프로필 갱신), 데이터를 쓸 때 "삽입"할지 "업데이트"할지 자동으로 판단해야 합니다.
- 일부 필드만 변경되는 경우(예: 주문의 `status`만 업데이트)에도 매번 전체 레코드를 구성해야 하는 번거로움이 있습니다.

이러한 시나리오를 위해 Doris Unique(기본 키) 모델은 **전체 행 업데이트**와 **부분 컬럼 업데이트**라는 두 가지 데이터 적재 기반 업데이트 방식을 지원합니다. 이 문서에서는 두 방식의 사용 방법을 설명합니다.

## 전체 행 업데이트 {#full-row-update}

<!-- Knowledge type: Capability definition -->

Doris Unique 모델에 데이터를 적재할 때는 **Upsert** 모드를 사용합니다. 새 데이터가 기록되면 Doris는 기본 키를 기준으로 "삽입"할지 "업데이트"할지 자동으로 판단합니다.

| 시나리오 | 동작 |
| --- | --- |
| 기본 키가 존재하지 않음 | 새 데이터 행 삽입 |
| 기본 키가 이미 존재함 | 기존 데이터 행을 새 데이터로 덮어쓰기 |

지원하는 데이터 적재 방식은 다음과 같습니다.

- Stream Load
- Broker Load
- Routine Load
- Insert Into

> 전체 행 업데이트는 새 레코드를 적재하는 것과 동일합니다. 자세한 사용 방법은 [데이터 적재](../import/import-way/stream-load-manual.md) 문서를 참조하세요.

## 부분 컬럼 업데이트 {#partial-column-update}

<!-- Knowledge type: Capability definition -->

일부 필드만 업데이트해야 하는 경우 Unique 모델의 부분 컬럼 업데이트 기능을 사용하면 전체 레코드를 구성할 필요가 없습니다. 사용 예시, 유연한 부분 컬럼 업데이트, 새 행 처리 방법을 비롯한 자세한 내용은 [컬럼 업데이트](./partial-column-update.md#column-update-on-the-unique-key-model) 문서를 참조하세요.
