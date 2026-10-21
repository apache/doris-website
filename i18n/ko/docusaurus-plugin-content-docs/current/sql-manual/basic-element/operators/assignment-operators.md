---
{
    "title": "할당 연산자",
    "language": "ko",
    "description": "할당 연산자는 연산자 오른쪽의 표현식을 왼쪽의 표현식에 할당합니다."
}
---

## 설명 {#description}

할당 연산자는 연산자 오른쪽의 표현식을 왼쪽의 표현식에 할당합니다. Doris에서 할당 연산자는 UPDATE 문의 SET 절과 SET 문에서만 사용할 수 있습니다. 자세한 내용은 [UPDATE](../../sql-statements/data-modification/DML/UPDATE.md) 문과 [SET](../../sql-statements/session/variable/SET-VARIABLE.md) 문을 참조하세요.

## 연산자 {#operators}

| 연산자 | 용도 | 예시 |
|----------|---------|---------|
| <x> = <y> | <y>의 결과를 <x>에 할당합니다. | `SET enable_profile = true` |
