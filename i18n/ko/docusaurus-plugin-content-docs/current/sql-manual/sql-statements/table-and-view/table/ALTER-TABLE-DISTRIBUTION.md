---
{
    "title": "ALTER TABLE DISTRIBUTION",
    "language": "ko",
    "description": "이 문은 파티션 테이블의 기본 분산 버킷 구성을 변경하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 파티션 테이블의 기본 분산 버킷 구성을 변경하는 데 사용됩니다. 이 작업은 동기적으로 수행되며, 명령이 반환되면 실행이 완료된 것입니다.

이 문은 **새로 생성되는 파티션**의 기본 버킷 수만 변경합니다. 기존 파티션의 버킷 수는 그대로 유지됩니다.

구문:

```sql
ALTER TABLE [database.]table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(column1[, column2, ...]) BUCKETS { num | AUTO };
ALTER TABLE [database.]table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS { num | AUTO };
```

참고:

- `num`: 새 파티션에 사용할 고정 버킷 수를 지정하는 양의 정수입니다.
- `AUTO`: 데이터 양과 클러스터 구성에 따라 시스템이 새 파티션의 버킷 수를 자동으로 결정하도록 합니다.
- 분산 유형(HASH 또는 RANDOM)과 분산 컬럼은 원래 테이블 정의와 동일해야 합니다. 버킷 수만 변경할 수 있습니다.
- 이 문은 **파티션 테이블**(RANGE 또는 LIST 파티션으로 분할된 테이블)에만 적용됩니다. 파티션이 없는 테이블은 지원하지 않습니다.
- **Colocate** 테이블에서는 이 문을 지원하지 않습니다.
- 고정 버킷 수와 `AUTO` 사이를 자유롭게 전환할 수 있으며, 연속으로 여러 번 변경할 수 있습니다.

### AUTO PARTITION과의 상호 작용 {#interaction-with-auto-partition}

[AUTO PARTITION](../../../../table-design/data-partitioning/auto-partitioning)을 사용하는 테이블에서는 `ALTER TABLE MODIFY DISTRIBUTION` 실행 후 데이터 삽입으로 자동 생성되는 새 파티션에 새 버킷 구성이 적용됩니다. 변경 전에 이미 자동 생성된 파티션은 그대로 유지됩니다.

예를 들어 AUTO PARTITION 테이블이 원래 `BUCKETS 5`를 사용하다가 `BUCKETS 8`로 변경된 경우, 이후 INSERT가 새 자동 파티션 생성을 트리거하면 해당 파티션에 8개의 버킷이 할당됩니다. 이를 다시 `BUCKETS AUTO`로 변경하면 이후 자동 생성되는 파티션의 버킷 수는 시스템이 자동으로 결정합니다.

### Dynamic Partition과의 상호 작용 {#interaction-with-dynamic-partition}

[Dynamic Partition](../../../../table-design/data-partitioning/dynamic-partitioning)을 사용하는 테이블에서는 `ALTER TABLE MODIFY DISTRIBUTION` 실행 후 동적 파티션 스케줄러가 자동으로 생성하는 새 파티션에 새 버킷 구성이 적용됩니다. 기존 동적 파티션은 그대로 유지됩니다.

Dynamic Partition 테이블은 `dynamic_partition.buckets` 속성도 지원합니다. 두 설정이 모두 지정된 경우, 동적으로 생성되는 파티션에는 `dynamic_partition.buckets` 속성이 우선 적용됩니다. 동적 파티션에 테이블 수준의 기본 버킷 수(`MODIFY DISTRIBUTION`으로 설정)를 사용하려면, `dynamic_partition.buckets`를 명시적으로 설정하지 않거나 `ALTER TABLE ... SET ("dynamic_partition.buckets" = "...")`을 통해 해당 속성을 적절히 업데이트해야 합니다.

## 예제 {#example}

1. HASH 분산을 사용하는 RANGE 파티션 테이블의 기본 버킷 수를 기존 값에서 10으로 변경

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

이후 새로 추가되는 모든 파티션은 10개의 버킷을 사용합니다:

```sql
ALTER TABLE example_db.my_table ADD PARTITION p3 VALUES LESS THAN ('30');
-- p3 will have 10 buckets; existing partitions remain unchanged
```

2. 고정 버킷 수에서 AUTO로 전환

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
```

이후 새로 생성되는 파티션의 버킷 수는 시스템이 자동으로 결정합니다.

3. AUTO에서 고정 버킷 수로 다시 전환

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 3;
```

4. LIST 파티션 테이블의 기본 버킷 수 변경

```sql
ALTER TABLE example_db.my_list_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 8;
```

5. RANDOM 분산을 사용하는 테이블의 기본 버킷 수 변경

```sql
ALTER TABLE example_db.my_random_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS 12;
```

6. RANDOM 분산 테이블의 버킷 설정을 AUTO로 전환

```sql
ALTER TABLE example_db.my_random_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS AUTO;
```

7. AUTO PARTITION 테이블(RANGE)의 기본 버킷 수 변경

```sql
-- Original table uses AUTO PARTITION BY RANGE with BUCKETS 5
ALTER TABLE example_db.my_auto_range_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 8;

-- New auto-created partitions from subsequent INSERT will use 8 buckets
INSERT INTO example_db.my_auto_range_table VALUES ('2024-01-03', 3);
```

8. AUTO PARTITION 테이블(LIST)의 기본 버킷 수 변경

```sql
-- Original table uses AUTO PARTITION BY LIST with BUCKETS 4
ALTER TABLE example_db.my_auto_list_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 7;

-- New auto-created partitions from subsequent INSERT will use 7 buckets
INSERT INTO example_db.my_auto_list_table VALUES ('ccc', 3);
```

9. AUTO PARTITION 테이블의 버킷 설정을 AUTO에서 고정 버킷 수로 전환한 후 다시 AUTO로 전환

```sql
-- Table originally created with BUCKETS AUTO
ALTER TABLE example_db.my_auto_auto_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 5;
-- New partitions will use 5 buckets

ALTER TABLE example_db.my_auto_auto_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
-- New partitions will return to system-determined bucket count
```

10. 여러 번 연속으로 변경

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 4;
ALTER TABLE example_db.my_table ADD PARTITION p2 VALUES LESS THAN ('20');
-- p2 has 4 buckets

ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
ALTER TABLE example_db.my_table ADD PARTITION p3 VALUES LESS THAN ('30');
-- p3 has system-determined bucket count

ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 6;
ALTER TABLE example_db.my_table ADD PARTITION p4 VALUES LESS THAN ('40');
-- p4 has 6 buckets
```

11. 오류 사례

Colocate 테이블은 지원하지 않습니다:

```sql
-- This will fail with: "Cannot change default bucket number of colocate table"
ALTER TABLE example_db.my_colocate_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

파티션이 없는 테이블은 지원하지 않습니다:

```sql
-- This will fail with: "Only support change partitioned table's distribution"
ALTER TABLE example_db.my_unpartitioned_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

분산 유형은 변경할 수 없습니다:

```sql
-- Original table uses HASH distribution; changing to RANDOM will fail
-- Error: "Cannot change distribution type"
ALTER TABLE example_db.my_hash_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS 10;
```

분산 컬럼은 변경할 수 없습니다:

```sql
-- Original table uses HASH(k1); changing to HASH(k2) will fail
-- Error: "Cannot assign hash distribution with different distribution cols"
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k2) BUCKETS 10;
```

## 키워드 {#keywords}

```text
ALTER, TABLE, DISTRIBUTION, MODIFY DISTRIBUTION, BUCKETS, ALTER TABLE
```
