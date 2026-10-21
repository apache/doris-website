---
{
    "title": "ALTER DATABASE",
    "language": "ko",
    "description": "이 문은 지정된 데이터베이스의 속성을 설정하고, 데이터베이스 이름을 변경하며, 데이터베이스의 각종 할당량을 설정하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 지정된 데이터베이스의 속성을 설정하고, 데이터베이스 이름을 변경하며, 데이터베이스의 각종 할당량을 설정하는 데 사용됩니다.

## 구문 {#syntax}

```sql
ALTER DATABASE <db_name> RENAME <new_name>
ALTER DATABASE <db_name> SET { DATA | REPLICA | TRANSACTION } QUOTA <quota>
ALTER DATABASE <db_name> SET <PROPERTIES> ("<key>" = "<value>" [, ...])
```

## 필수 매개변수 {#required-parameters}

** 1. `<db_name>`**
>  변경할 데이터베이스의 식별자를 지정합니다.

** 2. `<new_db_name>`**
>  데이터베이스의 새 식별자를 지정합니다.

** 3. `<quota>`**
>  데이터베이스의 데이터 용량 할당량 또는 복제본 수 할당량

** 4. `<PROPERTIES>`**
>  이 데이터베이스에 대한 추가 정보

## 권한 관리 {#permission-control}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한         | 객체   | 참고            |
|:-----------|:-----|:--------------|
| ALTER_PRIV | 해당 데이터베이스 | 해당 데이터베이스를 변경할 수 있는 권한이 필요합니다. |

## 주의 사항 {#precautions}

데이터베이스 이름을 변경한 후에는 필요에 따라 REVOKE 및 GRANT 명령을 사용하여 해당 사용자 권한을 수정하세요. 데이터베이스의 기본 데이터 용량 할당량은 1024 GB이며, 기본 복제본 수 할당량은 1073741824입니다.

## 예제 {#example}

- 지정된 데이터베이스의 데이터 용량 할당량 설정

  ```sql
    ALTER DATABASE example_db SET DATA QUOTA 10995116277760;
  ```

- 데이터베이스 이름을 example_db에서 example_db2로 변경

  ```sql
    ALTER DATABASE example_db RENAME example_db2;
  ```

- 지정된 데이터베이스의 복제본 수 할당량 설정

  ```sql
    ALTER DATABASE example_db SET REPLICA QUOTA 102400;
  ```

- 데이터베이스에 속한 테이블의 기본 복제본 배치 전략 변경(이 작업은 새로 생성되는 테이블에만 적용되며 데이터베이스의 기존 테이블은 변경하지 않습니다)

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "tag.location.default:2");
  ```

- 데이터베이스에 속한 테이블의 기본 복제본 배치 정책 해제(이 작업은 새로 생성되는 테이블에만 적용되며 데이터베이스의 기존 테이블은 변경하지 않습니다)

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "");
  ```

- 데이터베이스에 속한 테이블의 기본 Storage Vault 변경(이 작업은 새로 생성되는 테이블에만 적용되며 데이터베이스의 기존 테이블은 변경하지 않습니다)

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("storage_vault_name" = "hdfs_demo_vault");
  ```

- 데이터베이스에 속한 테이블의 기본 Storage Vault 설정 해제(이 작업은 새로 생성되는 테이블에만 적용되며 데이터베이스의 기존 테이블은 변경하지 않습니다)

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("storage_vault_name" = "");
  ```

:::info 참고

데이터베이스의 `storage_vault_name` 설정은 버전 3.0.5부터 지원됩니다.

:::
