---
{
    "title": "복합 타입 쿼리",
    "language": "ko",
    "description": "Apache Doris에서 Array, Map, Struct, JSON과 같은 복합 타입을 쿼리하고 전용 SQL 함수로 반정형 데이터를 처리하는 방법을 알아봅니다.",
    "keywords": [
        "Doris 복합 타입",
        "Array 쿼리",
        "Map 쿼리",
        "Struct 쿼리",
        "JSON 쿼리",
        "반정형 데이터",
        "복합 타입 함수"
    ]
}
---

<!-- Knowledge type: Capability overview / Function index -->
<!-- Applicable scenarios: Semi-structured data queries / Nested field access -->

로그, 이벤트 추적, 사용자 프로필, 주문 상세 정보 등의 시나리오에서 비즈니스 데이터는 평면적인 관계형 구조인 경우가 드뭅니다. 대개 중첩 구조나 반정형 구조를 갖습니다. Apache Doris는 Array, Map, Struct, JSON과 같은 복합 타입을 지원하므로, 이러한 데이터를 원래 구조 그대로 저장하고 전용 함수로 쿼리하거나 연산할 수 있습니다.

## 활용 시나리오 {#applicable-scenarios}

복합 타입은 다음과 같은 쿼리 시나리오에 적합합니다.

- 태그, 카테고리, 여러 값을 갖는 상품 속성처럼 **Array**로 표현해야 하는 목록 형태의 필드.
- 구성 정보나 속성의 키-값 쌍처럼 **Map**으로 표현해야 하는 사전 형태의 필드.
- 중첩 객체나 복합 필드처럼 **Struct**로 표현해야 하는 구조화된 레코드.
- 스키마가 고정되지 않은 업스트림 시스템에서 전달되는 **JSON** 반정형 데이터.

## 복합 타입 함수 목록 {#complex-type-function-index}

Doris는 위의 복합 타입별로 쿼리에서 바로 사용할 수 있는 SQL 함수들을 제공합니다. 각 함수에 대한 자세한 설명은 SQL 매뉴얼의 SQL 함수 장을 참조하세요.

| 복합 타입 | 함수 문서 |
| --- | --- |
| Array | [Array 함수](../sql-manual/sql-functions/scalar-functions/array-functions/array) |
| Map | [Map 함수](../sql-manual/basic-element/sql-data-types/semi-structured/MAP) |
| Struct | [Struct 함수](../sql-manual/sql-functions/scalar-functions/struct-functions/struct) |
| JSON | [JSON 함수](../sql-manual/sql-functions/scalar-functions/json-functions/json-parse) |
