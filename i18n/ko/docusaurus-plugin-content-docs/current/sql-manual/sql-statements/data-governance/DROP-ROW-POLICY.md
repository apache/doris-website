---
{
    "title": "DROP ROW POLICY",
    "language": "ko",
    "description": "행 보안 정책을 삭제합니다. 행 보안 정책에 관한 자세한 내용은 \"보안 정책\" 장을 참조하세요"
}
---

## 설명 {#description}

행 보안 정책을 삭제합니다. 행 보안 정책에 관한 자세한 내용은 "보안 정책" 장을 참조하세요


## 구문 {#syntax}

```sql
DROP ROW POLICY <policy_name> on <table_name>
  [ FOR { <user_name> | ROLE <role_name> } ];
```

## 필수 매개변수 {#required-parameters}
**<policy_name>**

> 행 보안 정책 이름

**<table_name>**

> 테이블 이름

# 선택적 매개변수 (선택적 매개변수) {#optional-parameters-optional-parameters}

**<user_name>**

> 사용자 이름

**<role_name>**

> 역할 이름

# 접근 제어 요구 사항 (접근 제어 요구 사항) {#access-control-requirements-access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한                  | 객체 | 비고 |
| :------------------------- | :----- | :---- |
| ADMIN_PRIV 또는 *GRANT_PRIV* | 전역 |       |

# 예제 (예제) {#examples-examples}

1. *db1.table1*의 *policy1 행 보안 정책*을 삭제합니다

  ```sql
  DROP ROW POLICY policy1 ON db1.table1
  ```

1. user1에 적용되는 db1.table1의 policy1 행 보안 정책을 삭제합니다

  ```sql
  DROP ROW POLICY policy1 ON db1.table1 FOR user1
  ```

1. role1에 적용되는 db1.table1의 policy1 행 보안 정책을 삭제합니다

  ```sql
  DROP ROW POLICY policy1 ON db1.table1 FOR role role1
  ```
