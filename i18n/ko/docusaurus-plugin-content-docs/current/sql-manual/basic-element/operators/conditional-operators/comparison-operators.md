---
{
    "title": "비교 연산자",
    "language": "ko",
    "description": "비교 조건은 한 표현식을 다른 표현식과 비교합니다. 비교 결과는 TRUE, FALSE 또는 UNKNOWN일 수 있습니다."
}
---

## 설명 {#description}

비교 조건은 한 표현식을 다른 표현식과 비교합니다. 비교 결과는 TRUE, FALSE 또는 UNKNOWN일 수 있습니다.

## 연산자 소개 {#operator-introduction}

| 연산자 | 기능 | 예시 |
| ------------------- | ----------------------------------------------------------- | ------------------- |
| `=` | 동등 비교. 비교 대상 중 어느 한쪽이 UNKNOWN이면 결과는 UNKNOWN입니다. | `SELECT 1 = 1` |
| `<=>` | NULL 안전 동등 비교. 일반 동등 비교와 달리 NULL 안전 동등 비교는 NULL을 비교 가능한 값으로 취급합니다. 양쪽 모두 NULL이면 TRUE를 반환합니다. 한쪽만 NULL이면 FALSE를 반환합니다. 이 연산자는 UNKNOWN을 반환하지 않습니다. | `SELECT NULL <=> NULL` |
| `!=` `<>` | 부등 비교 | `SELECT 1 != 1` |
| `<` `>` | 초과 및 미만 비교 | `SELECT 1 > 1` |
| `<=` `>=` | 이상 및 이하 비교 | `SELECT 1 >= 1` |
| `<x> BETWEEN <y> AND <z>` | `<x> >= <y> and <x> <= <z>`와 동등합니다. `<y>` 이상이고 `<z>` 이하인지 비교합니다. | `SELECT 1 BETWEEN 0 AND 2` |
