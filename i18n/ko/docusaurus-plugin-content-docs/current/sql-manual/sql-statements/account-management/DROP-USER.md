---
{
    "title": "DROP USER",
    "language": "ko",
    "description": "DROP USER 문은 사용자를 삭제하는 데 사용됩니다."
}
---

## 설명 {#description}

`DROP USER` 문은 사용자를 삭제하는 데 사용됩니다.

## 구문 {#syntax}

```sql
  DROP USER <user_identity>
```

## 필수 매개변수 {#required-parameters}

**1. `<user_identity>`**

> 삭제할 사용자 ID입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한     | 객체    | 참고 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER 또는 ROLE    | 이 작업은 ADMIN_PRIV 권한이 있는 사용자 또는 역할만 수행할 수 있습니다  |

## 예제 {#example}

- 사용자 jack@'192.%' 삭제

```sql
DROP USER 'jack'@'192.%'
```
