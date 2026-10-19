---
{
    "title": "SET LDAP_ADMIN_PASSWORD",
    "language": "ko",
    "description": "SET LDAPADMINPASSWORD 명령은 LDAP 관리자 비밀번호를 설정하는 데 사용됩니다. LDAP 인증을 사용할 때,"
}
---

## 설명 {#description}

 `SET LDAP_ADMIN_PASSWORD` 명령은 LDAP 관리자 비밀번호를 설정하는 데 사용됩니다. LDAP 인증을 사용할 때 doris는 관리자 계정과 비밀번호를 사용하여 LDAP 서비스에서 로그인 사용자 정보를 쿼리해야 합니다.

## 구문 {#syntax}

```sql
 SET LDAP_ADMIN_PASSWORD = PASSWORD('<plain_password>')
```

## 필수 매개변수 {#required-parameters}

**1. `<plain_password>`**

LDAP 관리자 비밀번호

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한 | 객체 | 참고 사항                  |
| :--------------------- | :-------------- | :--------------------- |
| ADMIN_PRIV        | USER 또는 ROLE    | 이 작업은 `ADMIN_PRIV` 권한이 있는 사용자 또는 역할만 수행할 수 있습니다 |

## 예제 {#examples}

- LDAP 관리자 비밀번호 설정
  ```sql
  SET LDAP_ADMIN_PASSWORD = PASSWORD('123456')
  ```
