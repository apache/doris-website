---
{
    "title": "서브쿼리",
    "language": "ko",
    "description": "Doris 서브쿼리 가이드: 스칼라, 비스칼라, 상관 및 비상관 서브쿼리의 구문, 제한 사항, Mark Join 처리.",
    "keywords": [
        "Doris 서브쿼리",
        "서브쿼리",
        "스칼라 서브쿼리",
        "상관 서브쿼리",
        "IN EXISTS 서브쿼리",
        "Mark Join"
    ]
}
---

<!-- Knowledge type: Capability definition + Usage limitations -->
<!-- Applicable scenarios: Writing nested SQL queries / Troubleshooting subquery errors -->

서브쿼리는 다른 쿼리 안에 중첩된 SQL 쿼리로, 일반적으로 SELECT 문 안에 작성됩니다. SELECT, FROM, WHERE 또는 HAVING 절에 사용하여 외부 쿼리에 데이터나 조건을 제공할 수 있습니다. 서브쿼리를 사용하면 하나의 SQL 문에서 더 복잡한 필터링, 집계 및 조인 로직을 구현할 수 있습니다.

이 문서에서는 Doris의 서브쿼리 유형, 지원 범위, 제한 사항, 그리고 특수한 상황에서 사용하는 Mark Join 메커니즘을 설명합니다.

## 활용 시나리오 {#applicable-scenarios}

서브쿼리는 일반적으로 다음과 같은 상황에서 사용합니다.

- **복잡한 필터링**: `WHERE` 또는 `HAVING` 절에서 서브쿼리를 사용하여 필터 조건을 동적으로 계산합니다.
- **파생 컬럼 계산**: `SELECT` 목록에서 스칼라 서브쿼리를 사용하여 필드를 추가합니다.
- **파생 테이블**: `FROM` 절에서 서브쿼리를 조인에 참여하는 임시 테이블로 사용합니다.
- **존재 여부 확인**: `EXISTS`/`NOT EXISTS` 또는 `IN`/`NOT IN`을 사용하여 집합 간의 관계를 평가합니다.

## 서브쿼리의 기본 특성 {#basic-characteristics-of-subqueries}

서브쿼리를 사용할 때는 다음과 같은 기본 특성을 고려해야 합니다.

| 특성 | 설명 |
| --- | --- |
| 위치 | `SELECT`, `FROM`, `WHERE` 또는 `HAVING` 절에 사용할 수 있으며, `SELECT`, `UPDATE`, `INSERT`, `DELETE` 문뿐 아니라 `=`, `>`, `<`, `<=`, `IN`, `EXISTS`와 같은 표현식 연산자와 함께 사용할 수 있습니다. |
| 외부/내부 관계 | 외부 쿼리를 주 쿼리라고 하며, 그 안에 중첩된 쿼리를 서브쿼리라고 합니다. |
| 실행 순서 | 독립적인 서브쿼리는 일반적으로 먼저 실행됩니다. 상관관계가 있으면 파서가 필요에 따라 실행 순서를 결정하고 서브쿼리 결과를 주 쿼리에 전달합니다. |
| 구문 제약 | 주 쿼리와 구분할 수 있도록 서브쿼리를 괄호로 감싸야 합니다. |

아래 예제에서는 모두 두 테이블인 `t1`과 `t2`를 사용합니다. DDL은 다음과 같습니다.

```sql
create table t1
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");

create table t2
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

## 서브쿼리의 유형 {#categories-of-subqueries}

서브쿼리는 **반환 데이터의 특성**과 **외부 쿼리의 컬럼을 참조하는지 여부**라는 두 가지 기준으로 분류할 수 있습니다.

### 반환 데이터의 특성에 따른 분류 {#classification-by-returned-data-characteristics}

반환 데이터의 특성에 따라 서브쿼리를 스칼라 서브쿼리와 비스칼라 서브쿼리로 나눌 수 있습니다.

| 유형 | 반환 결과 | 테이블이 비어 있을 때의 반환값 | 사용 가능한 위치 |
| --- | --- | --- | --- |
| 스칼라 서브쿼리 | 단일 값(행 하나와 컬럼 하나로 구성된 릴레이션) | `NULL` | 단일 값 표현식을 사용할 수 있는 모든 위치 |
| 비스칼라 서브쿼리 | 릴레이션(여러 행과 컬럼을 포함할 수 있음) | 빈 집합(0개 행) | 릴레이션(집합)을 사용할 수 있는 모든 위치 |

예제(`t2`가 비어 있으면 두 서브쿼리는 서로 다른 결과를 반환합니다):

```sql
-- Scalar subquery. When t2 is empty, the subquery returns the scalar value null.
select * from t1 where t1.c1 > (select sum(t2.c1) from t2);

-- Non-scalar subquery. When t2 is empty, the subquery returns an empty set (0 rows).
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

### 외부 컬럼 참조 여부에 따른 분류 {#classification-by-whether-outer-columns-are-referenced}

외부 쿼리의 컬럼을 참조하는지 여부에 따라 서브쿼리를 상관 서브쿼리와 비상관 서브쿼리로 나눌 수 있습니다.

| 유형 | 외부 컬럼 참조 여부 | 실행 방식 |
| --- | --- | --- |
| 비상관 서브쿼리 | 아니요 | 일반적으로 독립적으로 평가할 수 있으며, 외부 쿼리에서 사용할 결과를 한 번 반환합니다. |
| 상관 서브쿼리 | 예(주로 서브쿼리의 `WHERE` 절에서 참조) | 외부 테이블의 각 행마다 서브쿼리를 한 번씩 실행해야 하며, 이는 외부 테이블에 대한 필터 연산과 동일합니다. |

예제:

```sql
-- Correlated subquery. The subquery uses the outer table column t1.c2.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t2.c2 = t1.c2);

-- Uncorrelated subquery. The subquery does not reference any column of the outer table t1.
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

## Doris가 지원하는 서브쿼리 {#subqueries-supported-by-doris}

<!-- Knowledge type: Capability support matrix -->

Doris는 모든 비상관 서브쿼리를 지원합니다. 상관 서브쿼리의 지원 범위는 다음과 같습니다.

- `WHERE` 및 `HAVING` 절의 상관 스칼라 서브쿼리를 지원합니다.
- `IN`, `NOT IN`, `EXISTS` 또는 `NOT EXISTS`를 사용하는 상관 비스칼라 서브쿼리를 `WHERE` 및 `HAVING` 절에서 지원합니다.
- `SELECT` 목록의 상관 스칼라 서브쿼리를 지원합니다.
- 중첩 서브쿼리에서는 바로 상위 쿼리와의 상관관계만 지원합니다. 중간 단계를 건너뛰어 더 바깥쪽 쿼리와 맺는 상관관계는 지원하지 않습니다.

## 상관 서브쿼리의 제한 사항 {#limitations-of-correlated-subqueries}

<!-- Knowledge type: Usage limitations -->
<!-- Applicable scenarios: SQL error troubleshooting / Rewriting correlated subqueries -->

Doris에서는 상관 서브쿼리의 형태에 따라 서로 다른 제한 사항이 적용됩니다. 아래에서 각각 설명합니다.

### 상관 스칼라 서브쿼리의 제한 사항 {#limitations-of-correlated-scalar-subqueries}

4.1.5부터 `UNION`, `INTERSECT` 또는 `EXCEPT`와 같은 집합 연산을 포함하면서 외부 컬럼을 참조하는 서브쿼리는 분석 단계에서 명시적으로 거부되며, 예를 들어 `Unsupported correlated subquery with set operation` 오류가 발생합니다. 집합 연산을 사용하는 비상관 서브쿼리에는 영향이 없습니다. 그룹화되지 않은 집계에 적용되는 최상위 `EXISTS` 또는 `NOT EXISTS`는 결과를 알 수 있는 경우 여전히 true 또는 false로 단순화될 수 있습니다. 이는 집합 연산을 포함하는 모든 서브쿼리가 지원되지 않는다는 의미는 아닙니다.

다음 두 조건을 모두 충족해야 합니다.

- 상관 조건은 동등 조건이어야 합니다.
- 서브쿼리의 출력은 단일 집계 함수의 결과여야 하며, `group by` 절을 포함해서는 안 됩니다.

```sql
-- Single aggregate function and no group by: supported.
select * from t1 where t1.c1 < (select max(t2.c1) from t2 where t1.c2 = t2.c2);

-- The equivalent rewritten SQL:
select t1.* from t1 inner join (select t2.c2 as c2, max(t2.c1) as c1 from t2 group by t2.c2) tx on t1.c1 < tx.c1 and t1.c2 = tx.c2;

-- Non-equality correlation condition: not supported.
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 > t2.c2);

-- No aggregate function: not supported.
select * from t1 where t1.c1 = (select t2.c1 from t2 where t1.c2 = t2.c2);

-- Aggregate function present but with group by: not supported.
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 = t2.c2 group by t2.c2);
```

### 상관 (NOT) EXISTS 서브쿼리의 제한 사항 {#limitations-of-correlated-not-exists-subqueries}

- 서브쿼리에서 `offset`과 `limit`을 함께 사용할 수 없습니다.

```sql
-- With limit but without offset: supported.
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2);

-- The equivalent rewritten SQL:
select * from t1 left semi join t2 on t1.c2 = t2.c2;

-- With both offset and limit: not supported.
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2, 3);
```

### 상관 (NOT) IN 서브쿼리의 제한 사항 {#limitations-of-correlated-not-in-subqueries}

다음 세 조건을 모두 충족해야 합니다.

- 서브쿼리는 단일 컬럼을 출력해야 합니다.
- 서브쿼리에서 `limit`을 사용할 수 없습니다.
- 서브쿼리에서 집계 함수나 `group by` 절을 사용할 수 없습니다.

```sql
-- Supported subquery.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2);

-- The equivalent rewritten SQL:
select * from t1 left semi join t2 on t1.c1 = t2.c1 and t1.c2 = t2.c2;

-- Multi-column output in the subquery: not supported.
select * from t1 where (t1.a, t1.c) in (select t2.c1, t2.c from t2 where t1.c2 = t2.c2);

-- Subquery with limit: not supported.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 limit 3);

-- With a group by clause: not supported.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 group by t2.c1);

-- With an aggregate function: not supported.
select * from t1 where t1.c1 in (select sum(t2.c1) from t2 where t1.c2 = t2.c2);
```

### 중첩 서브쿼리의 제한 사항 {#limitations-of-nested-subqueries}

현재는 서브쿼리와 바로 상위 쿼리 사이의 상관관계만 지원합니다. 더 바깥쪽 쿼리와의 상관관계는 지원하지 않습니다.

다음과 같이 정의된 `t3` 테이블도 있다고 가정합니다.

```sql
create table t3
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

- 지원: 서브쿼리가 바로 상위 쿼리의 컬럼만 참조합니다.

    ```sql
    select
        t1.c1
    from
        t1
    where not exists (
        select
            t2.c1
        from
            t2
        where not exists (
            select
                t3.c1
            from
                t3
            where
                t3.c2 = t2.c2
        ) and t2.c2 = t1.c2
    );
    ```

- 지원하지 않음: 가장 안쪽 서브쿼리가 바로 상위 쿼리의 `t2.c2`와 가장 바깥쪽 쿼리의 `t1.c1`을 모두 참조합니다.

    ```sql
    select
        t1.c1
    from
        t1
    where not exists (
        select
            t2.c1
        from
            t2
        where not exists (
            select
                t3.c1
            from
                t3
            where
                t3.c2 = t2.c2 and t3.c1 = t1.c1
        )
    );
    ```

## Mark Join {#mark-join}

<!-- Knowledge type: Execution mechanism -->
<!-- Applicable scenarios: When a subquery has an OR relationship with other filter conditions -->

`WHERE` 절에서 `(NOT) IN` 또는 `(NOT) EXISTS` 서브쿼리가 다른 필터 조건과 `OR` 관계로 결합되어 있으면, 올바른 결과를 얻기 위해 특별한 처리가 필요합니다. 예를 들면 다음과 같습니다.

```sql
select
    t1.c1,
    t1.c2
from t1
where exists (
    select
        t2.c1
    from t2
    where
        t1.c2 = t2.c2
    ) or t1.c1 > 0;
```

위의 `EXISTS` 절을 곧바로 `LEFT SEMI JOIN`으로 재작성하면, 해당 조인의 의미에 따라 `t1`에서 `t1.c2 = t2.c2`를 만족하는 행만 반환됩니다. 하지만 `t1.c1 > 0`을 만족하는 행도 반환되어야 합니다. 이를 처리하기 위해 Doris는 **Mark Join** 메커니즘을 도입했습니다.

:::info 참고
`RIGHT SEMI JOIN`도 유사하며, 왼쪽 테이블과 오른쪽 테이블의 위치만 서로 바뀝니다. 여기서는 `LEFT SEMI JOIN`을 예로 사용합니다.
:::

예제 SQL은 다음과 같습니다.

```sql
-- This SQL cannot actually be executed. It is shown for illustration only.
select
    tx.c1,
    tx.c2
from
    (
        select
            t1.c1,
            t1.c2,
            mark_join_flag
        from
            t1 left (mark) semi join t2 on t1.c2 = t2.c2
    ) tx
where
    tx.mark_join_flag or tx.c1 > 0;
```

Mark Join과 일반적인 `LEFT SEMI JOIN`의 차이는 다음과 같습니다. 일반적인 `LEFT SEMI JOIN`은 조건을 만족하는 왼쪽 테이블의 행을 바로 출력합니다. Mark Join은 원래의 왼쪽 테이블에 값이 `TRUE`, `FALSE` 또는 `NULL`인 플래그 컬럼을 추가하여 출력합니다(예제에서는 `mark_join_flag`). 이 플래그의 값은 `JOIN` 조건식 `t1.c2 = t2.c2`에 따라 결정됩니다. 각 행에 대응하는 플래그 값은 아래와 같습니다.

| t1.c2 | t2.c2 | mark_join_flag |
| ----- | ----- | -------------- |
| 1     | 1     | TRUE           |
| 1     | 2     | FALSE          |
| 1     | NULL  | NULL           |
| NULL  | 1     | NULL           |
| NULL  | NULL  | NULL           |

이 플래그 컬럼을 사용하면 원래의 `WHERE` 필터 조건을 `where mark_join_flag or t1.c1 > 0`으로 재작성하여 올바른 결과를 얻을 수 있습니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting runtime errors of scalar subqueries -->

스칼라 서브쿼리의 출력은 단일 값이어야 하므로, 서브쿼리가 둘 이상의 레코드를 반환하면 런타임 오류가 발생합니다.

### 상관 스칼라 서브쿼리가 여러 행을 반환하는 경우 {#correlated-scalar-subquery-returns-multiple-rows}

상관 스칼라 서브쿼리를 사용할 때, 특정 외부 행에 대해 서브쿼리가 상관 조건을 만족하는 행을 둘 이상 반환하면 런타임 오류가 발생합니다.

```sql
-- Correlated scalar subquery. If more than one row in t2 satisfies t1.c2 = t2.c2, a runtime error is reported.
select t1.*, (select t2.c1 from t2 where t1.c2 = t2.c2) from t1;

-- Example error message:
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT][E33] correlate scalar subquery must return only 1 row
```

### 비상관 스칼라 서브쿼리가 여러 행을 반환하는 경우 {#uncorrelated-scalar-subquery-returns-multiple-rows}

Doris는 런타임에 `assert num rows` 연산자를 추가합니다. 서브쿼리가 둘 이상의 레코드를 반환하면 런타임 오류가 발생합니다.

```sql
-- Uncorrelated scalar subquery. If t2 contains more than one row, a runtime error may be reported.
select t1.*, (select t2.c1 from t2) from t1;

-- Example error message:
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]Expected EQ 1 to be returned by expression
```
