---
{
    "title": "MERGE-INTO",
    "language": "ko",
    "description": "다른 테이블이나 서브쿼리의 값을 기준으로 테이블의 값을 삽입, 업데이트, 삭제합니다."
}
---

## 설명 {#description}

다른 테이블이나 서브쿼리의 값을 기준으로 테이블의 값을 삽입, 업데이트, 삭제합니다. 다른 테이블이 대상 테이블에 삽입할 새 행, 업데이트할 수정된 행, 삭제하도록 표시된 행을 포함하는 변경 로그인 경우 병합을 유용하게 사용할 수 있습니다.

이 명령은 다음 경우에 대한 처리 방식을 지원합니다:

- 값이 일치하는 경우(업데이트 및 삭제).
- 값이 일치하지 않는 경우(삽입).

이 명령의 대상 테이블은 UNIQUE KEY 모델 테이블이어야 합니다.

## 구문 {#syntax}

```sql
MERGE INTO <target_table>
    USING <source>
    ON <join_expr>
    { matchedClause | notMatchedClause } [ ... ]
```

여기서 각 절은 다음과 같이 정의됩니다:

```sql
matchedClause ::=
    WHEN MATCHED
        [ AND <case_predicate> ]
        THEN { UPDATE SET <col_name> = <expr> [ , <col_name> = <expr> ... ] | DELETE } 
```

```sql
notMatchedClause ::=
    WHEN NOT MATCHED
        [ AND <case_predicate> ]
        THEN INSERT [ ( <col_name> [ , ... ] ) ] VALUES ( <expr> [ , ... ] )
```

## 매개변수 {#parameters}

**\<target_table\>**

> 병합할 테이블을 지정합니다.


**\<source\>**

> 대상 테이블과 조인할 테이블 또는 서브쿼리를 지정합니다.

**\<join_expr\>**

> 대상 테이블과 소스를 조인하는 데 사용할 조건식을 지정합니다.

### matchedClause (업데이트 또는 삭제용) {#matchedclause-for-updates-or-deletes}

**WHEN MATCHED ... AND \<case_predicate\>**

> 선택적으로 조건식을 지정합니다. 이 식이 참이면 일치하는 경우의 처리를 실행합니다.  
> 기본값: 없음(일치하는 경우의 처리를 항상 실행)

**WHEN MATCHED ... THEN { UPDATE SET ... | DELETE }**

> 값이 일치할 때 수행할 작업을 지정합니다.

**SET col_name = expr [ , col_name = expr ... ]**

> 해당 표현식을 새 열 값으로 사용하여 대상 테이블의 지정된 열을 업데이트합니다(대상 및 소스 릴레이션을 모두 참조할 수 있음).  
> 하나의 SET 하위 절에서 업데이트할 열을 여러 개 지정할 수 있습니다.

**DELETE**

> 대상 테이블에서 소스와 일치하는 행을 삭제합니다.

### notMatchedClause (삽입용) {#notmatchedclause-for-inserts}

**WHEN NOT MATCHED ... AND \<case_predicate\>**

> 선택적으로 조건식을 지정합니다. 이 식이 참이면 일치하지 않는 경우의 처리를 실행합니다.
> 기본값: 없음(일치하지 않는 경우의 처리를 항상 실행)

**WHEN NOT MATCHED ... THEN INSERT [ ( col_name [ , ... ] ) ] VALUES ( expr [ , ... ] )**

> 값이 일치하지 않을 때 수행할 작업을 지정합니다.

**( col_name [ , ... ] )**

> 소스의 값을 삽입할 대상 테이블의 열을 하나 이상 선택적으로 지정합니다.
> 기본값: 없음(대상 테이블의 모든 열에 값을 삽입)

**VALUES ( expr [ , ... ] )**

> 삽입할 열 값에 해당하는 표현식을 지정합니다(소스 릴레이션을 참조해야 함).

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 [사용자](../../../../admin-manual/auth/authentication-and-authorization.md)는 최소한 다음 [권한](../../../../admin-manual/auth/authentication-and-authorization.md)을 가지고 있어야 합니다:

| 권한 | 객체 | 설명 |
| :---------------- | :------------ | :- |
| SELECT_PRIV       | 대상 테이블 및 소스 |  |
| LOAD_PRIV       | 대상 테이블 |  |

## 사용 시 유의 사항 {#usage-note}

- 이 명령의 대상 테이블은 UNIQUE KEY 모델 테이블이어야 합니다.
- 하나의 MERGE 문에 일치하는 경우와 일치하지 않는 경우를 처리하는 절(즉, WHEN MATCHED ... 및 WHEN NOT MATCHED ...)을 여러 개 포함할 수 있습니다.
- AND 하위 절을 생략한 절(기본 동작)은 일치 여부와 관계없이 해당 문에서 같은 유형의 절 중 마지막에 와야 합니다(예를 들어 WHEN MATCHED ... 절 뒤에 WHEN MATCHED AND ... 절이 올 수 없습니다). 이 순서를 지키지 않으면 도달할 수 없는 분기가 생겨 오류가 반환됩니다.

### 중복 조인 시 동작 {#duplicate-join-behavior}

현재 Doris는 중복된 조인 행이 발생하는지 감지하지 않습니다. 중복이 발생하면 동작은 정의되지 않습니다.

조인 후 동일한 대상 테이블 행에 여러 작업(예: 업데이트, 삭제 또는 삽입)이 동시에 적용되면 INSERT 문과 유사하게 동작합니다. Sequence 열이 있으면 Sequence 열의 값에 따라 최종적으로 기록되는 데이터가 결정되며, 없으면 행 중 하나가 임의로 기록됩니다.

## 예제 {#examples}

다음 예제에서는 소스 테이블의 값을 사용해 대상 테이블의 데이터를 업데이트하는 기본 병합 작업을 수행합니다. 먼저 두 테이블을 생성하고 데이터를 적재합니다:

```sql
CREATE TABLE `merge_into_source_table` (
      `c1` int NULL,
      `c2` varchar(255) NULL
    ) ENGINE=OLAP
    PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
    );

CREATE TABLE `merge_into_target_base_table` (
      `c1` int NULL,
      `c2` varchar(255) NULL
    ) ENGINE=OLAP
    UNIQUE KEY(`c1`)
    DISTRIBUTED BY HASH(`c1`)
    PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
    );

INSERT INTO merge_into_source_table VALUES (1, 12), (2, 22), (3, 33);
INSERT INTO merge_into_target_base_table VALUES (1, 1), (2, 10);
```

테이블의 값을 조회합니다:

```sql
SELECT * FROM merge_into_source_table;
```

```
+----+----+
| c1 | c2 |
+----+----+
| 1  | 12 |
| 2  | 22 |
| 3  | 33 |
+----+----+
```

```sql
SELECT * FROM merge_into_target_base_table;
```

```
+----+----+
| c1 | c2 |
+----+----+
| 2  | 10 |
| 1  | 1  |
+----+----+
```

MERGE 문을 실행합니다:

```sql
WITH tmp AS (SELECT * FROM merge_into_source_table)
MERGE INTO merge_into_target_base_table t1
    USING tmp t2
    ON t1.c1 = t2.c1
    WHEN MATCHED AND t1.c2 = 10 THEN DELETE
    WHEN MATCHED THEN UPDATE SET c2 = 10
    WHEN NOT MATCHED THEN INSERT VALUES(t2.c1, t2.c2)
```

대상 테이블의 새 값을 조회합니다(소스 테이블은 변경되지 않음):


```sql
SELECT * FROM merge_into_target_base_table;
```

```
+----+----+
| c1 | c2 |
+----+----+
| 3  | 33 |
| 1  | 10 |
+----+----+
```
