---
{
    "title": "RECOVER",
    "language": "ko",
    "description": "이 구문은 이전에 삭제한 데이터베이스, 테이블 또는 파티션을 복구하는 데 사용됩니다."
}
---

## 설명 {#description}

이 구문은 이전에 삭제한 데이터베이스, 테이블 또는 파티션을 복구하는 데 사용됩니다.

이름이나 ID로 지정한 메타데이터를 복구할 수 있으며, 복구한 메타데이터의 이름을 변경할 수도 있습니다.

## 구문: {#syntax}

```sql
RECOVER { DATABASE <db_name> [<db_id>] [AS <new_db_name>] 
        | TABLE [<db_name>.]<table_name> [<table_id>] [AS <new_table_name>] 
        | PARTITION <partition_name> [<partition_id>] FROM [<db_name>.]<table_name> [AS <new_partition_name>] }
```

## 필수 매개변수 {#required-parameters}

데이터베이스 복구

**1. `<db_name>`**
> 복구할 데이터베이스의 이름입니다.

테이블 복구

**1. `<table_name>`**
> 복구할 테이블의 이름입니다.

파티션 복구

**1. `<partition_name>`**
> 복구할 파티션의 이름입니다.

**2. `<table_name>`**
> 파티션이 속한 테이블의 이름입니다.

## 선택적 매개변수 {#optional-parameters}

데이터베이스 복구

**1. `<db_id>`**
> 복구할 데이터베이스의 ID입니다.

**2. `<new_db_name>`**
> 복구한 데이터베이스의 새 이름입니다.

테이블 복구

**1. `<db_name>`**
> 테이블이 속한 데이터베이스의 이름입니다.

**2. `<table_id>`**
> 복구할 테이블의 ID입니다.

**3. `<new_table_name>`**
> 복구한 테이블의 새 이름입니다.

파티션 복구

**1. `<partition_id>`**
> 복구할 파티션의 ID입니다.

**2. `<db_name>`**
> 테이블이 속한 데이터베이스의 이름입니다.

**3. `<new_partition_name>`**
> 복구한 파티션의 새 이름입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

| 권한   | 객체 | 비고 |
|-------------|--------|------|
| ADMIN_PRIV  |        |      |

## 사용 시 참고 사항 {#usage-notes}

- 이 작업은 삭제 후 일정 기간이 지나지 않은 메타데이터만 복구할 수 있습니다. 기본값은 1일입니다(`catalog_trash_expire_second` 매개변수를 `fe.conf`에서 설정하여 변경할 수 있습니다).
- 메타데이터를 복구할 때 ID를 지정하지 않으면 기본적으로 같은 이름으로 가장 최근에 삭제한 메타데이터가 복구됩니다.
- 현재 복구할 수 있는 메타데이터는 `SHOW CATALOG RECYCLE BIN`을 사용하여 조회할 수 있습니다.
- 복구 작업은 휴지통에 있는 기존 메타데이터, 데이터, 복제본을 다시 연결하며 새로운 데이터 쓰기나 복제본 생성으로 취급되지 않습니다. 따라서 복구된 객체로 인해 데이터베이스 사용량이 할당량을 초과하더라도 데이터 및 복제본 할당량 때문에 `RECOVER`가 차단되지는 않습니다. 이후 데이터나 복제본을 추가하는 작업에는 해당 할당량이 계속 적용됩니다.

## 예시 {#examples}

1. 이름이 `example_db`인 데이터베이스를 복구합니다.

    ```sql
    RECOVER DATABASE example_db;
    ```

2. 이름이 `example_tbl`인 테이블을 복구합니다.

    ```sql
    RECOVER TABLE example_db.example_tbl;
    ```

3. 이름이 `p1`인 파티션을 `example_tbl` 테이블에서 복구합니다.

    ```sql
    RECOVER PARTITION p1 FROM example_tbl;
    ```

4. ID가 `example_db_id`이고 이름이 `example_db`인 데이터베이스를 복구합니다.

    ```sql
    RECOVER DATABASE example_db example_db_id;
    ```

5. ID가 `example_tbl_id`이고 이름이 `example_tbl`인 테이블을 복구합니다.

    ```sql
    RECOVER TABLE example_db.example_tbl example_tbl_id;
    ```

6. ID가 `p1_id`이고 이름이 `p1`인 파티션을 `example_tbl` 테이블에서 복구합니다.

    ```sql
    RECOVER PARTITION p1 p1_id FROM example_tbl;
    ```

7. ID가 `example_db_id`이고 이름이 `example_db`인 데이터베이스를 복구하고 이름을 `new_example_db`로 변경합니다.

    ```sql
    RECOVER DATABASE example_db example_db_id AS new_example_db;
    ```

8. 이름이 `example_tbl`인 테이블을 복구하고 이름을 `new_example_tbl`로 변경합니다.

    ```sql
    RECOVER TABLE example_db.example_tbl AS new_example_tbl;
    ```

9. ID가 `p1_id`이고 이름이 `p1`인 파티션을 `example_tbl` 테이블에서 복구하고 이름을 `new_p1`로 변경합니다.

    ```sql
    RECOVER PARTITION p1 p1_id AS new_p1 FROM example_tbl;
    ```
