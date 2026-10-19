---
{
    "title": "CREATE DATABASE",
    "language": "ko",
    "description": "이 구문은 새 데이터베이스를 생성하는 데 사용됩니다"
}
---

## 설명 {#description}

이 구문은 새 데이터베이스를 생성하는 데 사용됩니다

## 구문 {#syntax}

```sql
CREATE DATABASE [IF NOT EXISTS] <db_name>
    [PROPERTIES ("<key>"="<value>"[, ... ])];
```

## 필수 매개변수 {#required-parameters}

** 1. `<db_name>`**
>  데이터베이스 이름

## 선택 매개변수 {#optional-parameters}

** 1. `<PROPERTIES>`**
>  이 데이터베이스에 대한 추가 정보

## 권한 제어 {#permission-control}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다:

| 권한         | 객체    | 비고             |
|:-----------|:------|:---------------|
| CREATE_PRIV | 해당 데이터베이스 | 해당 데이터베이스에 대한 생성 권한이 필요합니다 |


## 주의 사항 {#precautions}

데이터베이스에 속한 테이블의 기본 복제본 배치 전략을 지정하려면 `<replication_allocation>`을 지정해야 합니다(테이블의 `<replication_allocation>` 속성이 데이터베이스 설정보다 우선합니다):

  ```sql
  PROPERTIES (
    "replication_allocation" = "tag.location.default:3"
  )
  ```

데이터베이스에 속한 테이블의 기본 Storage Vault를 지정하려면 `<storage_vault_name>`을 지정해야 합니다(테이블의 `<storage_vault_name>` 속성이 데이터베이스 설정보다 우선합니다):

  ```sql
  PROPERTIES (
    "storage_vault_name" = "hdfs_demo_vault"
  )
  ```

:::info 참고

데이터베이스의 `storage_vault_name` 설정은 버전 3.0.5부터 지원됩니다

:::

## 예제 {#example}

- 새 데이터베이스 db_test 생성

   ```sql
   CREATE DATABASE db_test;
   ```

- 새 데이터베이스를 생성하고 기본 복제본 배치 설정:

   ```sql
   CREATE DATABASE `db_test`
   PROPERTIES (
   	"replication_allocation" = "tag.location.group_1:3"
   );
   ```

- 새 데이터베이스를 생성하고 기본 Storage Vault 설정:

   ```sql
   CREATE DATABASE `db_test`
   PROPERTIES (
   	"storage_vault_name" = "hdfs_demo_vault"
   );
   ```
