---
{
    "title": "논리 연산자",
    "language": "ko",
    "description": "논리 조건은 두 구성 요소의 조건 결과를 결합하여 이를 바탕으로 하나의 결과를 생성합니다."
}
---

## 설명 {#description}

논리 조건은 두 구성 요소의 조건 결과를 결합하여 이를 바탕으로 하나의 결과를 생성하거나, 조건의 결과를 반전시킵니다.

## 연산자 소개 {#operator-introduction}

| 연산자 | 기능                                                      | 예시                |
| ------- | ------------------------------------------------------------ | ---------------------- |
| NOT    | 뒤따르는 조건이 FALSE이면 TRUE를 반환합니다. TRUE이면 FALSE를 반환합니다. UNKNOWN이면 UNKNOWN을 유지합니다. | `SELECT NOT (TRUE)`     |
| AND    | 두 구성 요소의 조건이 모두 TRUE이면 TRUE를 반환합니다. 하나라도 FALSE이면 FALSE를 반환합니다. 그 외에는 UNKNOWN을 반환합니다. | `SELECT TRUE AND FALSE` |
| OR     | 두 구성 요소 중 하나의 조건이라도 TRUE이면 TRUE를 반환합니다. 두 조건이 모두 FALSE이면 FALSE를 반환합니다. 그 외에는 UNKNOWN을 반환합니다. | `SELECT TRUE OR NULL`  |

## 진리표 {#truth-tables}

### NOT 진리표 {#not-truth-table}

|       | TRUE   | FALSE | UNKNOWN |
| :----  | :------ | :------ |
| NOT    | FALSE  | TRUE   | UNKNOWN |

### AND 진리표 {#and-truth-table}

| AND      | TRUE    | FALSE | UNKNOWN |
| :------ | :------ | :---- | :------ |
| TRUE    | TRUE    | FALSE | UNKNOWN |
| FALSE   | FALSE   | FALSE | FALSE   |
| UNKNOWN | UNKNOWN | FALSE | UNKNOWN |

### OR 진리표 {#or-truth-table}

| OR       | TRUE | FALSE   | UNKNOWN |
| :------ | :--- | :------ | :------ |
| TRUE    | TRUE | TRUE    | TRUE    |
| FALSE   | TRUE | FALSE   | UNKNOWN |
| UNKNOWN | TRUE | UNKNOWN | UNKNOWN |
