---
{
    "title": "DROP ENCRYPTKEY",
    "language": "ko",
    "description": "사용자 정의 키를 삭제합니다. 키 이름은 삭제할 키의 이름과 정확히 일치해야 합니다."
}
---

## 설명 {#description}

사용자 정의 키를 삭제합니다. 키 이름은 삭제할 키의 이름과 정확히 일치해야 합니다.

## 구문 {#syntax}

```sql
DROP ENCRYPTKEY [IF EXISTS] <key_name>
```

## 필수 매개변수 {#required-parameters}

**1. `<key_name>`**

> 삭제할 키의 이름을 지정합니다. 데이터베이스 식별자를 포함할 수 있습니다.
> 예: `db1.my_key`

## 선택적 매개변수 {#optional-parameters}

**1. `[IF EXISTS]`**

> 지정하면 존재하지 않는 키를 삭제하려고 해도 오류가 발생하지 않습니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한    | 대상      | 설명                                                                                   |
|:-------------|:------------|:----------------------------------------------------------------------------------------|
| `ADMIN_PRIV` | 사용자 / 역할 | 사용자 또는 역할이 키 삭제 작업을 수행하려면 `ADMIN_PRIV` 권한을 보유해야 합니다 |

## 예제 {#example}

- 키 삭제

  ```sql
  DROP ENCRYPTKEY my_key;
  ```
- 키가 존재하지 않아도 오류 없이 삭제

  ```sql
  DROP ENCRYPTKEY IF EXISTS testdb.my_key;
  ```
