---
{
    "title": "DROP CATALOG RECYCLE BIN",
    "language": "ko",
    "description": "이 문은 휴지통에 있는 데이터베이스, 테이블 또는 파티션을 즉시 삭제하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 휴지통에 있는 데이터베이스, 테이블 또는 파티션을 즉시 삭제하는 데 사용됩니다.

## 구문 {#syntax}

```sql
DROP CATALOG RECYCLE BIN WHERE { 'DbId' = <db_id> | 'TableId' = <table_id> | 'PartitionId' = <partition_id> }
```

## 필수 매개변수 {#required-parameters}

DbId로 데이터베이스 삭제

**1. `<db_id>`**
> 즉시 삭제할 데이터베이스의 ID입니다.

TableId로 테이블 삭제

**1. `<table_id>`**
> 즉시 삭제할 테이블의 ID입니다.

PartitionId로 파티션 삭제

**1. `<partition_id>`**
> 즉시 삭제할 파티션의 ID입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

| 권한   | 객체 | 비고 |
|-------------|--------|------|
| ADMIN_PRIV  |        |      |

## 사용 시 참고 사항 {#usage-notes}

- 데이터베이스, 테이블 또는 파티션을 삭제하면 휴지통에서 `catalog_trash_expire_second`초 후에 삭제됩니다(`fe.conf`에서 설정). 이 문을 사용하면 즉시 삭제됩니다.
- `'DbId'`, `'TableId'`, `'PartitionId'`는 대소문자를 구분하지 않으며, 작은따옴표와 큰따옴표도 구분하지 않습니다.
- 휴지통에 없는 데이터베이스를 삭제하면 휴지통에 있는 동일한 `DbId`의 모든 테이블과 파티션도 삭제됩니다. 아무 항목(데이터베이스, 테이블 또는 파티션)도 삭제되지 않은 경우에만 오류를 보고합니다. 휴지통에 없는 테이블을 삭제할 때도 동일하게 적용됩니다.
- `SHOW CATALOG RECYCLE BIN`을 사용하여 현재 삭제할 수 있는 메타데이터를 쿼리할 수 있습니다.

## 예제 {#examples}

1. DbId가 `example_db_id`인 데이터베이스, 테이블 및 파티션 삭제

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'DbId' = example_db_id;
    ```

2. TableId가 `example_tbl_id`인 테이블 및 파티션 삭제

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'TableId' = example_tbl_id;
    ```

3. PartitionId가 `p1_id`인 파티션 삭제

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'PartitionId' = p1_id;
    ```
