---
{
    "title": "ALTER TABLE ADD GENERATED COLUMN",
    "language": "ko",
    "description": "ALTER TABLE ADD COLUMN을 사용한 생성 컬럼 추가는 지원되지 않습니다."
}
---

ALTER TABLE ADD COLUMN을 사용한 생성 컬럼 추가와 ALTER TABLE MODIFY COLUMN을 사용한 생성 컬럼 정보 수정은 지원되지 않습니다.
ALTER TABLE 구문을 사용하면 생성 컬럼의 순서와 이름을 변경하거나 생성 컬럼을 삭제할 수 있습니다.

지원되지 않는 작업을 수행하면 다음 오류가 발생합니다.

```sql
mysql> CREATE TABLE test_alter_add_column(a int, b int) properties("replication_num"="1");
Query OK, 0 rows affected (0.14 sec)
mysql> ALTER TABLE test_alter_add_column ADD COLUMN c int AS (a+b);
ERROR 1105 (HY000): errCode = 2, detailMessage = Not supporting alter table add generated columns.
mysql> ALTER TABLE test_alter MODIFY COLUMN c int KEY AS (a+b+1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Not supporting alter table modify generated columns.
```

### 컬럼 순서 변경 {#reorder-column}

```sql
ALTER TABLE products ORDER BY (product_id, total_value, price, quantity);
```

참고:
변경된 컬럼 순서도 생성 컬럼 정의 및 테이블 생성 시 적용되는 순서 제약을 충족해야 합니다.
### 컬럼 이름 변경 {#rename-column}

```sql
ALTER TABLE products RENAME COLUMN total_value new_name;
```

참고:
테이블의 컬럼(생성 컬럼 또는 일반 컬럼)을 다른 생성 컬럼이 참조하는 경우, 이 생성 컬럼의 이름을 변경하려면 먼저 이를 참조하는 다른 생성 컬럼을 삭제해야 합니다.
### 컬럼 삭제 {#drop-column}

```sql
ALTER TABLE products DROP COLUMN total_value;
```

참고:
테이블의 컬럼(생성 컬럼 또는 일반 컬럼)을 다른 생성 컬럼이 참조하는 경우, 참조되는 생성 컬럼이나 일반 컬럼을 삭제하려면 먼저 이를 참조하는 다른 생성 컬럼을 삭제해야 합니다.
