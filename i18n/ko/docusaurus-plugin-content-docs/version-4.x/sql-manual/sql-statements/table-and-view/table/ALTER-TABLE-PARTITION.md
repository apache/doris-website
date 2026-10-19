---
{
    "title": "ALTER TABLE PARTITION",
    "language": "ko",
    "description": "이 문은 파티션이 있는 테이블을 수정하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 파티션이 있는 테이블을 수정하는 데 사용됩니다.

이 작업은 동기식으로 실행되며, 명령이 반환되면 실행이 완료된 것입니다.

구문:

```sql
ALTER TABLE [database.]table alter_clause;
```

파티션의 alter_clause는 다음과 같은 변경 방식을 지원합니다.

1. 파티션 추가

구문:

```sql
ADD PARTITION [IF NOT EXISTS] partition_name
partition_desc ["key"="value"]
[DISTRIBUTED BY HASH (k1[,k2 ...]) [BUCKETS num]]
```

유의 사항:

- partition_desc는 다음 두 가지 표기 방식을 지원합니다.
  - VALUES LESS THAN [MAXVALUE|("value1", ...)]
  - VALUES [("value1", ...), ("value1", ...))
- 파티션 범위는 왼쪽 경계를 포함하고 오른쪽 경계를 포함하지 않습니다. 사용자가 오른쪽 경계만 지정하면 시스템이 왼쪽 경계를 자동으로 결정합니다.
- 버킷팅 방식을 지정하지 않으면 테이블 생성 시 사용한 버킷팅 방식과 버킷 수가 자동으로 적용됩니다.
- 버킷팅 방식을 지정하는 경우 버킷 수만 변경할 수 있으며, 버킷팅 방식이나 버킷팅 컬럼은 변경할 수 없습니다. 버킷팅 방식을 지정하고 버킷 수는 지정하지 않으면 테이블 생성 시 지정한 수 대신 기본값인 `10`이 버킷 수로 사용됩니다. 버킷 수를 변경하려면 버킷팅 방식도 함께 지정해야 합니다.
- ["key"="value"] 부분에서는 파티션의 일부 속성을 설정할 수 있습니다. [CREATE TABLE](./CREATE-TABLE)을 참조하세요.
- 테이블 생성 시 파티션을 명시적으로 생성하지 않은 경우 ALTER를 통한 파티션 추가는 지원되지 않습니다.
- 리스트 파티션을 사용하는 경우 테이블에 기본 파티션을 추가할 수 있습니다. 기본 파티션에는 기존 파티션 키의 제약 조건을 충족하지 않는 모든 데이터가 저장됩니다.
  -  ALTER TABLE table_name ADD PARTITION partition_name

2. 파티션 삭제

구문:

```sql
DROP PARTITION [IF EXISTS] partition_name [FORCE]
```

 유의 사항:

- 파티션을 사용하는 테이블에는 최소한 하나의 파티션이 남아 있어야 합니다.
- DROP PARTITION 실행 후 일정 기간 동안은 RECOVER 문을 통해 삭제된 파티션을 복구할 수 있습니다. 자세한 내용은 SQL 매뉴얼 - 데이터베이스 관리 - RECOVER 문을 참조하세요.
- DROP PARTITION FORCE를 실행하면 시스템은 파티션에 완료되지 않은 트랜잭션이 있는지 확인하지 않고 파티션을 즉시 삭제하며, 삭제된 파티션은 복구할 수 없습니다. 일반적으로 이 작업은 권장되지 않습니다.

3. 파티션 속성 수정

 구문:

```sql
MODIFY PARTITION p1|(p1[, p2, ...]) SET ("key" = "value", ...)
```

설명:

- 현재 다음 파티션 속성의 수정을 지원합니다.
  - storage_medium
    -storage_cooldown_time
  - replication_num
  - in_memory
- 단일 파티션 테이블의 경우 partition_name은 테이블 이름과 같습니다.

## 예제 {#example}

1. 기존 파티션이 [MIN, 2013-01-01)인 테이블에 파티션 [2013-01-01, 2014-01-01)을 추가하고 기본 버킷팅 방식을 사용합니다.

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2014-01-01");
```

2. 파티션을 추가하고 새로운 버킷 수를 사용합니다.

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2015-01-01")
DISTRIBUTED BY HASH(k1) BUCKETS 20;
```

3. 파티션을 추가하고 새로운 복제본 수를 사용합니다.

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2015-01-01")
("replication_num"="1");
```

4. 파티션의 복제본 수를 수정합니다.

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION p1 SET("replication_num"="1");
```

5. 지정한 파티션을 일괄 수정합니다.

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION (p1, p2, p4) SET("replication_num"="1");
```

6. 모든 파티션을 일괄 수정합니다.

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION (*) SET("storage_medium"="HDD");
```

7. 파티션을 삭제합니다.

```sql
ALTER TABLE example_db.my_table
DROP PARTITION p1;
```

8. 파티션을 일괄 삭제합니다.

```sql
ALTER TABLE example_db.my_table
DROP PARTITION p1,
DROP PARTITION p2,
DROP PARTITION p3;
```

9. 상한과 하한을 지정하여 파티션을 추가합니다.

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES [("2014-01-01"), ("2014-02-01"));
```

## 키워드 {#keywords}

```text
ALTER, TABLE, PARTITION, ALTER TABLE
```

## 모범 사례 {#best-practice}
