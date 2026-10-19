---
{
    "title": "EXISTS 연산자",
    "language": "ko",
    "description": "EXISTS 조건은 서브쿼리에 행이 존재하는지 확인하는 데 사용됩니다."
}
---

## 설명 {#description}

EXISTS 조건은 서브쿼리에 행이 존재하는지 확인하는 데 사용됩니다.

## 연산자 소개 {#operator-introduction}

| 연산자 | 기능 | 예제 |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| EXISTS | 서브쿼리가 데이터 행을 하나 이상 반환하면 TRUE를 반환합니다 | `SELECT department_id FROM departments d WHERE EXISTS (SELECT * FROM employees e WHERE d.department_id = e.department_id) ORDER BY department_id;` |
