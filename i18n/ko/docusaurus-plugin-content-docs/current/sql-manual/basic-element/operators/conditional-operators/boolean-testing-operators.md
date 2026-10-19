---
{
    "title": "불리언 검사 연산자",
    "language": "ko",
    "description": "이 연산자는 TRUE, FALSE 또는 NULL인지 확인하는 용도로만 사용됩니다. NULL에 대한 설명은 \"NULL\" 섹션을 참조하세요."
}
---

## 설명 {#description}

이 연산자는 TRUE, FALSE 또는 NULL인지 확인하는 용도로만 사용됩니다. NULL에 대한 설명은 "NULL" 섹션을 참조하세요.

## 연산자 소개 {#operator-introduction}

| 연산자 | 기능 | 예제 |
| -------------------- | ------------------------------------------------------------ | ------------------------ |
| `x IS [NOT] TRUE` | x가 TRUE인지 확인합니다. x가 TRUE이면 TRUE를 반환하고, 그렇지 않으면 FALSE를 반환합니다. | `SELECT 1 IS NOT TRUE` |
| `x IS [NOT] FALSE` | x가 FALSE인지 확인합니다. x가 FALSE이면 TRUE를 반환하고, 그렇지 않으면 FALSE를 반환합니다. | `SELECT 1 IS NOT FALSE` |
| `x IS [NOT] NULL` | x가 NULL인지 확인합니다. x가 NULL이면 TRUE를 반환하고, 그렇지 않으면 FALSE를 반환합니다. | `SELECT 1 IS NOT NULL` |
