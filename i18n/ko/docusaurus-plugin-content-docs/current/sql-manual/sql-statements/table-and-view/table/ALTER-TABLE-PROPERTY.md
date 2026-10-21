---
{
    "title": "ALTER TABLE PROPERTY",
    "language": "ko",
    "description": "이 문은 기존 테이블의 속성을 수정하는 데 사용됩니다. 이 작업은 동기식으로 수행되며,"
}
---

:::caution
파티션 속성과 테이블 속성의 차이
- 파티션 속성은 주로 버킷 수(buckets), 저장 매체(storage_medium), 복제본 수(replication_num), 핫/콜드 데이터 분리 정책(storage_policy)에 관한 것입니다.
  - 기존 파티션은 ALTER TABLE {tableName} MODIFY PARTITION ({partitionName}) SET ({key}={value})를 사용하여 속성을 수정할 수 있지만, 버킷 수(buckets)는 변경할 수 없습니다.
  - 아직 생성되지 않은 동적 파티션은 ALTER TABLE {tableName} SET (dynamic_partition.{key} = {value})를 사용하여 속성을 수정할 수 있습니다.
  - 아직 생성되지 않은 자동 파티션은 ALTER TABLE {tableName} SET ({key} = {value})를 사용하여 속성을 수정할 수 있습니다.
  - 파티션 속성을 수정하려면 이미 생성된 파티션의 속성과 아직 생성되지 않은 파티션의 속성을 모두 수정해야 합니다.
- 위의 속성을 제외한 나머지 속성은 모두 테이블 수준의 속성입니다.
- 구체적인 속성은 [테이블 생성 속성](../../../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md#table-property-related-parameters)을 참조하십시오.
:::

## 설명 {#description}

이 문은 기존 테이블의 속성을 수정하는 데 사용됩니다. 이 작업은 동기식으로 수행되며, 명령이 반환되면 실행이 완료되었음을 의미합니다.

현재 수정할 수 있는 테이블 속성은 bloom filter 컬럼, colocate_with 속성, dynamic_partition 속성, replication_num 및 default.replication_num입니다.

구문:

```sql
ALTER TABLE [database.]table alter_clause;
```

속성을 변경하는 alter_clause는 다음과 같은 수정 방식을 지원합니다.

참고:

위의 스키마 변경 작업에 통합하여 수정할 수도 있습니다. 아래 예제를 참조하십시오.

1. 테이블의 bloom filter 컬럼 수정

```sql
ALTER TABLE example_db.my_table SET ("bloom_filter_columns"="k1,k2,k3");
```

위의 스키마 변경 작업에 포함할 수도 있습니다(여러 절을 사용하는 경우 구문이 약간 다릅니다).

```sql
ALTER TABLE example_db.my_table
DROP COLUMN col2
PROPERTIES ("bloom_filter_columns"="k1,k2,k3");
```

2. 테이블의 Colocate 속성 수정

```sql
ALTER TABLE example_db.my_table set ("colocate_with" = "t1");
```

3. 테이블의 버킷 분할 방식을 Hash Distribution에서 Random Distribution으로 변경

```sql
ALTER TABLE example_db.my_table set ("distribution_type" = "random");
```

4. 테이블의 동적 파티션 속성 수정(동적 파티션 속성이 없는 테이블에 동적 파티션 속성을 추가하는 것도 지원)

```sql
ALTER TABLE example_db.my_table set ("dynamic_partition.enable" = "false");
```

동적 파티션 속성이 없는 테이블에 동적 파티션 속성을 추가하려면 모든 동적 파티션 속성을 지정해야 합니다.
   (참고: 파티션이 없는 테이블에는 동적 파티션 속성을 추가할 수 없습니다.)

```sql
ALTER TABLE example_db.my_table set (
  "dynamic_partition.enable" = "true", 
  "dynamic_partition.time_unit" = "DAY", 
  "dynamic_partition.end" = "3", 
  "dynamic_partition.prefix" = "p", 
  "dynamic_partition. buckets" = "32"
);
```

5. 테이블의 in_memory 속성 수정. 값은 'false'로만 설정 가능

```sql
ALTER TABLE example_db.my_table set ("in_memory" = "false");
```

6. 배치 삭제 기능 활성화

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "BATCH_DELETE";
```

참고:

- unique 테이블만 지원합니다.
-  기존 테이블에서 배치 삭제 기능을 활성화할 수 있으며, 새 테이블은 생성 시부터 이 기능을 지원합니다.

7. sequence 컬럼 값에 따라 데이터 적재 순서를 보장하는 기능 활성화

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES (
  "function_column.sequence_type" = "Date"
);
```

참고:

- unique 테이블만 지원합니다.
- sequence_type은 sequence 컬럼의 유형을 지정하는 데 사용되며, 정수형과 시간형을 사용할 수 있습니다.
- 새로 적재되는 데이터의 순서만 보장할 수 있습니다. 기존 데이터는 변경할 수 없습니다.

8. 테이블의 기본 버킷 수를 50으로 변경

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 50;
```

참고:

- 파티션이 있고 Colocate가 아닌 테이블만 지원합니다. 자세한 내용은 [ALTER TABLE DISTRIBUTION](./ALTER-TABLE-DISTRIBUTION)을 참조하십시오.

9. 테이블 주석 수정

```sql
ALTER TABLE example_db.my_table MODIFY COMMENT "new comment";
```

10. 컬럼 주석 수정

```sql
ALTER TABLE example_db.my_table MODIFY COLUMN k1 COMMENT "k1", MODIFY COLUMN k2 COMMENT "k2";
```

11. 엔진 유형 수정

MySQL 유형만 ODBC 유형으로 변경할 수 있습니다. driver 값은 odbc.init 구성에 있는 드라이버 이름입니다.

```sql
ALTER TABLE example_db.mysql_table MODIFY ENGINE TO odbc PROPERTIES("driver" = "MySQL");
```

12. 복제본 수 수정

```sql
ALTER TABLE example_db.mysql_table SET ("replication_num" = "2");
ALTER TABLE example_db.mysql_table SET ("default.replication_num" = "2");
ALTER TABLE example_db.mysql_table SET ("replication_allocation" = "tag.location.default: 1");
ALTER TABLE example_db.mysql_table SET ("default.replication_allocation" = "tag.location.default: 1");
```

참고:
1. default 접두사가 붙은 속성은 수정할 테이블의 기본 복제본 배치를 나타냅니다. 이 속성을 수정해도 테이블의 현재 실제 복제본 배치는 변경되지 않으며, 파티션이 있는 테이블에서 새로 생성되는 파티션의 복제본 배치에만 영향을 줍니다.
2. 파티션이 없는 테이블에서 default 접두사가 없는 복제본 배치 속성을 수정하면 테이블의 기본 복제본 배치와 실제 복제본 배치가 모두 수정됩니다. 즉, 수정 후 `show create table` 문과 `show partitions from tbl` 문을 통해 복제본 배치가 수정된 것을 확인할 수 있습니다.
변경되었습니다.
3. 파티션이 있는 테이블의 실제 복제본 배치는 파티션 수준에서 관리됩니다. 즉, 각 파티션에는 고유한 복제본 배치가 있으며, `show partitions from tbl` 문으로 확인할 수 있습니다. 실제 복제본 배치를 수정하려면 `ALTER TABLE PARTITION`을 참조하십시오.

13\. **[실험적 기능]** `light_schema_change` 활성화

  생성 시 light_schema_change가 활성화되지 않은 테이블은 다음 문을 사용하여 활성화할 수 있습니다.

```sql
ALTER TABLE example_db.mysql_table SET ("light_schema_change" = "true");
```

## 예제 {#example}

1. 테이블의 bloom filter 컬럼 수정

```sql
ALTER TABLE example_db.my_table SET ("bloom_filter_columns"="k1,k2,k3");
```

위의 스키마 변경 작업에 포함할 수도 있습니다(여러 절을 사용하는 경우 구문이 약간 다릅니다).

```sql
ALTER TABLE example_db.my_table
DROP COLUMN col2
PROPERTIES ("bloom_filter_columns"="k1,k2,k3");
```

2. 테이블의 Colocate 속성 수정

```sql
ALTER TABLE example_db.my_table set ("colocate_with" = "t1");
```

3. 테이블의 버킷 분할 방식을 Hash Distribution에서 Random Distribution으로 변경

```sql
ALTER TABLE example_db.my_table set ("distribution_type" = "random");
```

4. 테이블의 동적 파티션 속성 수정(동적 파티션 속성이 없는 테이블에 동적 파티션 속성을 추가하는 것도 지원)

```sql
ALTER TABLE example_db.my_table set ("dynamic_partition.enable" = "false");
```

동적 파티션 속성이 없는 테이블에 동적 파티션 속성을 추가하려면 모든 동적 파티션 속성을 지정해야 합니다.
   (참고: 파티션이 없는 테이블에는 동적 파티션 속성을 추가할 수 없습니다.)

```sql
ALTER TABLE example_db.my_table set ("dynamic_partition.enable" = "true", "dynamic_partition.time_unit" = "DAY", "dynamic_partition.end" = "3", "dynamic_partition.prefix" = "p", "dynamic_partition. buckets" = "32");
```

5. 테이블의 in_memory 속성 수정. 값은 'false'로만 설정 가능

```sql
ALTER TABLE example_db.my_table set ("in_memory" = "false");
```

6. 배치 삭제 기능 활성화

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "BATCH_DELETE";
```

7. sequence 컬럼 값에 따라 데이터 적재 순서를 보장하는 기능 활성화

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date");
```

8. 테이블의 기본 버킷 수를 50으로 변경

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 50;
```

9. 테이블 주석 수정

```sql
ALTER TABLE example_db.my_table MODIFY COMMENT "new comment";
```

10. 컬럼 주석 수정

```sql
ALTER TABLE example_db.my_table MODIFY COLUMN k1 COMMENT "k1", MODIFY COLUMN k2 COMMENT "k2";
```

11. 엔진 유형 수정

```sql
ALTER TABLE example_db.mysql_table MODIFY ENGINE TO odbc PROPERTIES("driver" = "MySQL");
```

12. 테이블에 콜드/핫 데이터 분리를 위한 데이터 마이그레이션 정책 추가
```sql
 ALTER TABLE create_table_not_have_policy set ("storage_policy" = "created_create_table_alter_policy");
```
참고: 테이블에 연결된 저장 정책이 없는 경우에만 정책을 추가할 수 있습니다. 테이블에는 저장 정책을 하나만 지정할 수 있습니다.

13. 테이블의 파티션에 핫/콜드 데이터 마이그레이션 정책 추가
```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy"="created_create_table_partition_alter_policy");
```
참고: 테이블의 파티션에 연결된 저장 정책이 없는 경우에만 정책을 추가할 수 있습니다. 테이블에는 저장 정책을 하나만 지정할 수 있습니다.


## 키워드 {#keywords}

```text
ALTER, TABLE, PROPERTY, ALTER TABLE
```

## 모범 사례 {#best-practice}
