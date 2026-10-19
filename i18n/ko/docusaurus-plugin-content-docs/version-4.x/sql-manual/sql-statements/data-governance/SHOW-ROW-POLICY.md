---
{
    "title": "SHOW ROW POLICY",
    "language": "ko",
    "description": "행 보안 정책을 확인합니다. 행 보안 정책에 대한 자세한 내용은 \"보안 정책\" 장을 참조하세요"
}
---

## 설명 {#description}

행 보안 정책을 확인합니다. 행 보안 정책에 대한 자세한 내용은 "보안 정책" 장을 참조하세요

## 구문 {#syntax}

```sql
SHOW ROW POLICY [ FOR { <user_name> | ROLE <role_name> } ];
```
## 선택적 매개변수 {#optional-parameters}

**<user_name>**

> 사용자 이름

**<role_name>**

> 역할 이름

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한  | 객체 | 비고 |
| :--------- | :----- | :---- |
| ADMIN_PRIV | 전역 |       |

## 예제 {#examples}

1. 모든 보안 정책 확인


  ```sql
  SHOW ROW POLICY;
  ```

1. 사용자 이름을 지정하여 쿼리

  ```sql
  SHOW ROW POLICY FOR user1;
  ```

1. 역할 이름을 지정하여 쿼리

  ```sql
  SHOW ROW POLICY for role role1;
  ```
