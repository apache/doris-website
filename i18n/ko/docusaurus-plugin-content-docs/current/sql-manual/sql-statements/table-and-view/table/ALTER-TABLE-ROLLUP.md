---
{
    "title": "ALTER TABLE ROLLUP",
    "language": "ko",
    "description": "이 문은 기존 테이블의 rollup을 수정하는 데 사용됩니다. rollup은 비동기 작업이며,"
}
---

## 설명 {#description}

이 문은 기존 테이블의 rollup을 수정하는 데 사용됩니다. rollup은 비동기 작업으로, 작업이 성공적으로 제출되면 반환됩니다. 이후 [SHOW ALTER](../../../../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE) 명령으로 진행 상황을 확인할 수 있습니다.

문법:

```sql
ALTER TABLE [database.]table alter_clause;
```

rollup의 alter_clause는 다음 생성 방식을 지원합니다.

1. rollup 인덱스 생성

문법:

```sql
ADD ROLLUP rollup_name (column_name1, column_name2, ...)
[FROM from_index_name]
[PROPERTIES ("key"="value", ...)]
```

속성: 제한 시간을 설정할 수 있으며, 기본 제한 시간은 1일입니다.

2. rollup 인덱스 일괄 생성

문법:

```sql
ADD ROLLUP [rollup_name (column_name1, column_name2, ...)
                    [FROM from_index_name]
                    [PROPERTIES ("key"="value", ...)],...]
```

주의 사항:

- from_index_name을 지정하지 않으면 기본 인덱스를 기반으로 생성됩니다.
- rollup 테이블의 컬럼은 from_index에 이미 존재하는 컬럼이어야 합니다.
- properties에서 저장 형식을 지정할 수 있습니다. 자세한 내용은 [CREATE TABLE](./CREATE-TABLE)을 참조하세요.

3. rollup 인덱스 삭제

 문법:

```sql
DROP ROLLUP rollup_name [PROPERTIES ("key"="value", ...)]
```

4. rollup 인덱스 일괄 삭제

문법:

```sql
DROP ROLLUP [rollup_name [PROPERTIES ("key"="value", ...)],...]
```

주의 사항:

- 기본 인덱스는 삭제할 수 없습니다.

## 예제 {#example}

1. 기본 인덱스 (k1,k2,k3,v1,v2)를 기반으로 example_rollup_index 인덱스를 생성합니다. 열 지향 저장 방식을 사용합니다.

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index(k1, k3, v1, v2);
```

2. example_rollup_index (k1,k3,v1,v2)를 기반으로 example_rollup_index2 인덱스를 생성합니다.

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index2 (k1, v1)
FROM example_rollup_index;
```

3. 기본 인덱스 (k1,k2,k3,v1)를 기반으로 example_rollup_index3 인덱스를 생성하고, rollup 제한 시간을 한 시간으로 설정합니다.

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index(k1, k3, v1)
PROPERTIES("timeout" = "3600");
```

4. example_rollup_index2 인덱스를 삭제합니다.

```sql
ALTER TABLE example_db.my_table
DROP ROLLUP example_rollup_index2;
```

5. rollup 인덱스를 일괄 삭제합니다.

```sql
ALTER TABLE example_db.my_table
DROP ROLLUP example_rollup_index2,example_rollup_index3;
```

## 키워드 {#keywords}

```text
ALTER, TABLE, ROLLUP, ALTER TABLE
```

## 모범 사례 {#best-practice}
