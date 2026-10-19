---
{
    "title": "DROP DATABASE",
    "language": "ko",
    "description": "이 문은 데이터베이스를 삭제하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 데이터베이스를 삭제하는 데 사용됩니다.

## 구문 {#syntax}

```sql
DROP DATABASE [IF EXISTS] <db_name> [FORCE];
```

## 필수 매개변수 {#required-parameters}

** 1. `<db_name>`**
>  데이터베이스 이름

## 선택적 매개변수 {#optional-parameters}

** 1. `FORCE`**
>  휴지통으로 이동하지 않고 강제로 삭제합니다.

## 권한 관리 {#permission-control}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다:

| 권한         | 객체    | 설명             |
|:-----------|:------|:---------------|
| DROP_PRIV | 해당 데이터베이스 | 해당 데이터베이스에 대한 삭제 권한이 있어야 합니다 |


## 주의 사항 {#precautions}

DROP DATABASE FORCE를 실행하면 시스템은 데이터베이스에 완료되지 않은 트랜잭션이 있는지 확인하지 않습니다. 데이터베이스는 즉시 삭제되며 복구할 수 없습니다. 이 작업은 일반적으로 권장하지 않습니다.

## 예제 {#example}

준비: DROP 예제에서 삭제할 `db_test`를 생성합니다:

```sql
CREATE DATABASE db_test;
```

- db_test 데이터베이스 삭제

    ```sql
    DROP DATABASE db_test;
    ```
