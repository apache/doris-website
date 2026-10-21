---
{
    "title": "별칭 함수",
    "language": "ko",
    "description": "Apache Doris 별칭 함수 가이드: 함수나 표현식 일부에 새 시그니처를 등록하여 이기종 시스템에서 마이그레이션할 때 호환성을 높이고 복잡한 쿼리를 간소화합니다.",
    "keywords": [
        "Doris 별칭 함수",
        "별칭 함수",
        "CREATE ALIAS FUNCTION",
        "SQL 함수 호환성",
        "사용자 정의 함수",
        "쿼리 간소화",
        "데이터베이스 마이그레이션"
    ]
}
---

<!-- Knowledge type: Capability definition / Use cases -->
<!-- Applicable scenarios: Heterogeneous database migration / Complex query simplification -->

별칭 함수는 기존 함수나 표현식 일부에 새 시그니처를 등록하여 다른 이름으로 호출할 수 있게 합니다. 별칭 함수를 사용하면 이기종 데이터베이스에서 쿼리를 마이그레이션할 때 함수 이름의 차이를 감출 수 있으며, 복잡한 표현식 일부를 간결한 함수 호출로 감쌀 수도 있습니다.

## 개념 {#concept}

별칭 함수는 본질적으로 함수나 표현식 일부에 대해 시스템에 등록한 새 시그니처입니다. 별칭을 호출하는 것은 해당 별칭이 가리키는 실제 표현식을 호출하는 것과 같습니다.

다른 사용자 정의 함수와 마찬가지로 별칭 함수도 두 가지 범위를 지원합니다.

| 범위 | 등록 범위 | 호출 방법 |
| --- | --- | --- |
| `LOCAL` | 현재 데이터베이스 | 다른 데이터베이스에서 호출하려면 정규화된 이름 `<database name>.<function name>`을 사용합니다. |
| `GLOBAL` | 전역 | 모든 데이터베이스에서 함수 이름으로 직접 접근할 수 있습니다. |

## 사용 사례 {#use-cases}

<!-- Knowledge type: Use cases -->

### 시나리오 1: 이기종 데이터베이스 마이그레이션 중 함수 별칭 지정 {#scenario-1-aliasing-functions-during-heterogeneous-database-migration}

시스템을 마이그레이션할 때 기존 쿼리가 다른 데이터베이스 시스템에서 작성된 것일 수 있습니다. 이러한 쿼리에는 Doris 함수와 동작은 같지만 이름이 다른 함수가 포함된 경우가 많습니다.

Doris에서 원본 데이터베이스의 함수와 이름이 같은 별칭 함수를 정의하면 SQL 문을 하나씩 다시 작성하지 않고도 사용자가 변경을 의식할 필요 없이 마이그레이션을 완료할 수 있습니다.

### 시나리오 2: 복잡한 쿼리 간소화 {#scenario-2-simplifying-complex-queries}

복잡한 분석 시나리오에서는 같은 문이나 서로 다른 문에 반복되는 표현식이 많이 포함되는 경우가 흔합니다.

이러한 복잡한 표현식에 별칭 함수를 만들면 다음과 같은 이점이 있습니다.

- 쿼리 작성을 간소화할 수 있습니다.
- SQL의 가독성과 유지보수성을 높일 수 있습니다.
- 반복되는 표현식 간의 불일치로 인한 유지보수 비용을 줄일 수 있습니다.

## 지원 범위 {#supported-scope}

<!-- Knowledge type: Constraints and limitations -->

### 표현식 요구 사항 {#expression-requirements}

현재 별칭 함수가 가리키는 실제 표현식의 루트 노드는 함수 표현식이어야 합니다.

유효한 예:

```sql
-- Create an alias function named func with parameters INT, INT. The underlying expression is abs(foo + bar).
CREATE ALIAS FUNCTION func(INT, INT) WITH PARAMETER(foo, bar) AS abs(foo + bar);

-- Create an alias function named func with parameters DATETIMEV2(3), INT. The underlying expression is date_trunc(days_sub(foo, bar), 'day').
CREATE ALIAS FUNCTION func(DATETIMEV2(3), INT) WITH PARAMETER (foo, bar) AS date_trunc(days_sub(foo, bar), 'day');
```

유효하지 않은 예:

```sql
-- The root expression is not a function but an arithmetic operator.
CREATE ALIAS FUNCTION func(INT, INT) WITH PARAMETER(foo, bar) AS foo + bar;
```

### 매개변수 요구 사항 {#parameter-requirements}

현재 별칭 함수의 매개변수는 다음 두 가지 조건을 충족해야 합니다.

- 가변 길이 매개변수는 지원되지 않습니다.
- 매개변수가 하나 이상 필요합니다.
