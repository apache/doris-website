---
{
    "title": "IN 연산자",
    "language": "ko",
    "description": "IN 연산자는 값이 값 목록이나 서브쿼리에 포함되어 있는지 확인합니다."
}
---

## 설명 {#description}

IN 연산자는 값이 값 목록이나 서브쿼리에 포함되어 있는지 확인합니다.

## 연산자 소개 {#operator-introduction}

| 연산자 | 기능 | 예시 |
| ------- | ------------------------------------------------ | ------------------------------ |
| IN     | 항목 중 하나와 같은지 확인합니다. 같으면 TRUE를 반환합니다. | `SELECT 1 IN (SELECT 2)` |
| NOT IN | 어떤 항목과도 같지 않은지 확인합니다. 모두 다르면 TRUE를 반환합니다. | `SELECT 1 NOT IN (3, 4, 5)` |

## 타입 제약 조건 {#type-constraints}

`IN`과 `NOT IN`은 스칼라 기본 타입의 값만 지원합니다. `ARRAY`, `MAP`, `STRUCT`와 같은 복합 타입과 객체 타입은 왼쪽 표현식이나 `IN` 목록의 값으로 사용할 수 없습니다.

예를 들어, 다음 구문은 유효하지 않습니다.

```sql
SELECT STRUCT(1, 2) IN (STRUCT(1, 2));
SELECT [1, 2] IN ([1, 2]);
SELECT MAP('a', 1) IN (MAP('a', 1));
```
