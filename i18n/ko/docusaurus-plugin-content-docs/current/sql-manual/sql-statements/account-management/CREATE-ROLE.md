---
{
    "title": "CREATE ROLE",
    "language": "ko",
    "description": "CREATE ROLE 문은 권한이 없는 역할을 생성하는 데 사용되며, 생성한 역할에는 이후 GRANT 명령으로 권한을 부여할 수 있습니다."
}
---

## 설명 {#description}

`CREATE ROLE` 문은 권한이 없는 역할을 생성하는 데 사용되며, 생성한 역할에는 이후 GRANT 명령으로 권한을 부여할 수 있습니다.

## 구문 {#syntax}

```sql
 CREATE ROLE <role_name> [<comment>];
```

## 필수 매개변수 {#required-parameters}

**1. `<role_name>`**

> 역할의 이름입니다. 

## 선택적 매개변수 {#optional-parameters}

**1. `<comment>`**

> 역할의 주석입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한     | 객체    | 참고 사항 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER 또는 ROLE    | 이 작업은 ADMIN_PRIV 권한이 있는 사용자 또는 역할만 수행할 수 있습니다.  |

## 예제 {#example}

- 역할 생성

```sql
CREATE ROLE role1;
```

- 주석이 있는 역할 생성

```sql
CREATE ROLE role2 COMMENT "this is my first role";
```
