---
{
    "title": "ALTER TABLE RENAME",
    "language": "ko",
    "description": "이 문은 기존 테이블 속성의 특정 이름을 변경하는 데 사용됩니다. 이 작업은 동기적으로 수행되며,"
}
---

## 설명 {#description}

이 문은 기존 테이블 속성의 특정 이름을 변경하는 데 사용됩니다. 이 작업은 동기적으로 수행되며, 명령이 반환되면 실행이 완료되었음을 의미합니다.

구문:

```sql
ALTER TABLE [database.]table alter_clause;
```

이름 변경을 위한 alter_clause에서는 다음 이름을 변경할 수 있습니다.

1. 테이블 이름 변경

구문:

```sql
RENAME new_table_name;
```

2. rollup 인덱스 이름 변경

 구문:

```sql
RENAME ROLLUP old_rollup_name new_rollup_name;
```

3. 파티션 이름 변경

구문:

```sql
RENAME PARTITION old_partition_name new_partition_name;
```

4. 컬럼 이름 변경

:::tip 도움말
이 기능은 Apache Doris 1.2 버전부터 지원됩니다.
:::

컬럼 이름 변경



구문:

```sql
RENAME COLUMN old_column_name new_column_name;
```

주의 사항:

- 테이블을 생성할 때 속성에 'light_schema_change=true'를 설정해야 합니다.


## 예제 {#example}

1. table1 테이블의 이름을 table2로 변경

```sql
ALTER TABLE table1 RENAME table2;
```

2. example_table 테이블의 rollup1 rollup 인덱스 이름을 rollup2로 변경

```sql
ALTER TABLE example_table RENAME ROLLUP rollup1 rollup2;
```

3. example_table 테이블의 p1 파티션 이름을 p2로 변경

```sql
ALTER TABLE example_table RENAME PARTITION p1 p2;
```

4. example_table 테이블의 c1 컬럼 이름을 c2로 변경

```sql
ALTER TABLE example_table RENAME COLUMN c1 c2;
```

## 키워드 {#keywords}

```text
ALTER, TABLE, RENAME, ALTER TABLE
```

## 모범 사례 {#best-practice}
