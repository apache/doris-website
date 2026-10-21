---
{
    "title": "CREATE ROW POLICY",
    "language": "ko",
    "description": "테이블에 행 수준 보안 정책을 생성하여 지정된 사용자 또는 역할에 반환되는 행을 제한합니다."
}
---

## 설명 {#description}

테이블에 행 수준 보안 정책을 생성합니다. 이 정책은 테이블을 대상으로 하는 쿼리에 적용되는 필터 조건을 추가하여 지정된 사용자 또는 역할이 볼 수 있는 행을 제한합니다.

## 구문 {#syntax}

```sql
CREATE ROW POLICY [ IF NOT EXISTS ] <policy_name> 
ON <table_name> 
AS { RESTRICTIVE | PERMISSIVE } 
TO { <user_name> | ROLE <role_name> } 
USING (<filter>);
```
## 필수 매개변수 {#required-parameters}

**<policy_name>**

> 행 보안 정책 이름

**<table_name>**

> 테이블 이름

**<filter_type>**

> RESTRICTIVE는 여러 정책을 AND로 결합하고, PERMISSIVE는 여러 정책을 OR로 결합합니다.



> 쿼리 문의 필터 조건에 해당합니다. 예: id=1

## 선택적 매개변수 {#optional-parameters}

**<user_name>**

> 사용자 이름. root 및 admin 사용자에 대해서는 정책을 생성할 수 없습니다.

**<role_name>**

> 역할 이름

## 액세스 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한                     | 객체   | 비고  |
| ------------------------ | ------ | ----- |
| ADMIN_PRIV 또는 GRANT_PRIV | 전역   |       |

## 예제 {#examples}

1. 여러 행 보안 정책 생성

  ```sql
  CREATE ROW POLICY test_row_policy_1 ON test.table1 
  AS RESTRICTIVE TO test USING (c1 = 'a');
  CREATE ROW POLICY test_row_policy_2 ON test.table1 
  AS RESTRICTIVE TO test USING (c2 = 'b');
  CREATE ROW POLICY test_row_policy_3 ON test.table1 
  AS PERMISSIVE TO test USING (c3 = 'c');
  CREATE ROW POLICY test_row_policy_3 ON test.table1 
  AS PERMISSIVE TO test USING (c4 = 'd');
  ```

  table1 테이블에 대해 쿼리를 실행하면 SQL이 다음과 같이 재작성됩니다.

  ```sql
  SELECT * FROM (SELECT * FROM table1 WHERE (c1 = 'a' AND c2 = 'b') AND (c3 = 'c' OR c4 = 'd'))
  ```
