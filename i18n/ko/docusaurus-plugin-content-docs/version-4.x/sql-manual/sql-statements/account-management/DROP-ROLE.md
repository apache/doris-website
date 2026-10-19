---
{
    "title": "DROP ROLE",
    "language": "ko",
    "description": "DROP ROLE 문은 역할을 삭제하는 데 사용됩니다."
}
---

## 설명 {#description}

`DROP ROLE` 문은 역할을 삭제하는 데 사용됩니다.

## 구문 {#syntax}

```sql
  DROP ROLE [IF EXISTS] <role_name>;
```

## 필수 매개변수 {#required-parameters}

**1. `<role_name>`**：

> 역할의 이름입니다. 

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한     | 객체    | 참고 사항 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER 또는 ROLE    | 이 작업은 ADMIN_PRIV 권한이 있는 사용자 또는 역할만 수행할 수 있습니다  |

## 사용 시 참고 사항 {#usage-notes}

- 역할을 삭제해도 이전에 해당 역할에 속해 있던 사용자의 권한에는 영향을 주지 않습니다. 역할과 사용자의 연결만 해제되며, 사용자가 해당 역할을 통해 얻은 권한은 변경되지 않습니다.

## 예제 {#example}

사전 준비: `role1`을 생성하여 DROP 예제에서 삭제할 대상을 준비합니다:

```sql
CREATE ROLE role1;
```

- role1 삭제

```sql
DROP ROLE role1;
```
