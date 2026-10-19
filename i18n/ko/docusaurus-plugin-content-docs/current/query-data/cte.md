---
{
    "title": "공통 테이블 표현식(CTE)",
    "language": "ko",
    "description": "Apache Doris CTE(공통 테이블 표현식) 가이드: WITH 절로 임시 결과 집합을 정의합니다. 중첩 CTE와 재귀 CTE를 지원하며, 계층 구조 탐색, 그래프 탐색 등의 시나리오에 적합합니다.",
    "keywords": [
        "Doris CTE",
        "공통 테이블 표현식",
        "WITH 절",
        "재귀 CTE",
        "RECURSIVE",
        "중첩 CTE",
        "계층형 쿼리",
        "트리 구조 쿼리",
        "그래프 탐색",
        "cte_max_recursion_depth"
    ]
}
---

<!-- Knowledge type: Capability definition + Syntax reference -->
<!-- Applicable scenarios: Writing complex queries / Hierarchical and graph-structure traversal -->

공통 테이블 표현식(CTE)은 Apache Doris에서 `SELECT` 문 안에 임시 결과 집합을 정의하는 기능입니다. `WITH` 절로 한 번 선언하면 같은 SQL에서 여러 번 참조할 수 있습니다. CTE는 주로 복잡한 쿼리를 단순화하고, 중복된 하위 쿼리를 제거하며, 계층 구조나 그래프 탐색과 같은 자기 참조 로직을 표현하는 데 사용합니다.

## 활용 시나리오 {#applicable-scenarios}

<!-- Knowledge type: Applicable scenarios -->

다음과 같은 상황에서 CTE를 사용하면 SQL이 더 명확해지고 유지보수가 쉬워집니다.

- **같은 하위 쿼리를 여러 번 참조하는 경우**: 하위 쿼리에 CTE 이름을 지정하면 메인 쿼리에서 같은 내용을 반복해서 작성하지 않아도 됩니다.
- **깊게 중첩된 하위 쿼리를 읽기 어려운 경우**: 로직을 여러 CTE로 나누고 각 단계에 이름을 지정하면 가독성이 높아집니다.
- **이전 단계의 결과를 바탕으로 계산하는 경우**: 중첩 CTE를 사용하면 뒤에 정의된 CTE에서 앞서 정의된 CTE의 결과를 직접 참조할 수 있습니다.
- **계층 구조 또는 트리 구조 탐색**: 조직 계층, 카테고리 목록, 중첩된 댓글 스레드 등이 해당합니다. 재귀 CTE를 사용하면 하나의 쿼리로 모든 계층을 펼쳐 볼 수 있습니다.
- **그래프의 도달 가능한 노드 탐색**: 지정된 노드에서 시작하여 간선을 따라가며 도달 가능한 모든 노드를 찾는 경우 등이 해당합니다.

## 기본 사용법 {#basic-usage}

### 구문 개요 {#syntax-overview}

`WITH` 절을 사용하여 하나 이상의 CTE를 정의하고, 쉼표로 구분합니다. 각 CTE는 이름과 하위 쿼리로 구성됩니다.

```sql
WITH
    cte_name1 AS (subquery1),
    cte_name2 AS (subquery2)
SELECT ... FROM cte_name1 JOIN cte_name2 ON ...;
```

`WITH` 절이 포함된 문에서는 각 CTE 이름을 참조하여 해당 임시 결과 집합에 접근할 수 있습니다.

### 간단한 CTE 예제 {#simple-cte-example}

다음 예제는 `cte1`과 `cte2`를 `WITH` 절에서 정의하고, 바깥쪽 `SELECT`에서 두 CTE를 모두 참조합니다.

```sql
WITH
    cte1 AS (SELECT a, b FROM table1),
    cte2 AS (SELECT c, d FROM table2)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

### 중첩 CTE {#nested-cte}

다른 CTE 안에서 CTE 이름을 참조할 수 있으므로, 앞서 정의한 CTE를 바탕으로 새로운 CTE를 정의할 수 있습니다.

```sql
WITH
    cte1 AS (SELECT a, b FROM table1),
    cte2 AS (SELECT c, d FROM cte1)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

## 재귀 CTE {#recursive-cte}

<!-- Knowledge type: Capability definition + Syntax reference -->
<!-- Applicable scenarios: Tree/hierarchical traversal, graph traversal, hierarchical aggregation -->

재귀 CTE(`RECURSIVE` 키워드를 사용하는 CTE)는 하나의 SQL 문 안에서 자기 참조 쿼리를 표현합니다. 주로 트리 및 계층 구조 탐색, 그래프 탐색, 계층별 집계에 사용합니다.

### 구문 {#syntax}

```sql
WITH [RECURSIVE] cte_name [(col1, col2, ...)] AS (
    <anchor_query>     -- Non-recursive part (executed once)
    UNION [ALL]
    <recursive_query>  -- Recursive part that can reference cte_name
)
SELECT ... FROM cte_name;
```

핵심 사항:

- `RECURSIVE` 키워드를 사용하면 CTE 정의에서 자기 자신을 참조할 수 있습니다.
- 앵커 멤버와 재귀 멤버는 열 개수와 각 열의 타입이 정확히 같아야 합니다.
- `recursive_query`는 `cte_name`을 참조할 수 있으며, 일반적으로 `JOIN`을 사용합니다.

### 구성 {#composition}

재귀 CTE는 두 부분으로 구성되며, 일반적으로 `UNION` 또는 `UNION ALL`로 연결합니다.

| 구성 요소 | 설명 |
|---|---|
| 앵커 쿼리 | 재귀가 없는 부분으로, 한 번 실행하여 초기 행 집합(시드)을 생성합니다. |
| 재귀 쿼리 | CTE 자체를 참조할 수 있으며, 이전 반복에서 생성된 행을 바탕으로 새로운 행을 생성합니다. |

새로운 행이 더 이상 생성되지 않거나 시스템 한도에 도달할 때까지 재귀를 계속합니다.

### 실행 방식(반복 모델) {#execution-semantics-iterative-model}

<!-- Knowledge type: Execution principle -->

재귀 CTE의 일반적인 실행 흐름은 다음과 같습니다.

1. `anchor_query`를 실행하고, 결과를 출력 집합(Output)에 기록한 다음 첫 번째 반복의 작업 집합(WorkSet)으로 사용합니다.
2. WorkSet이 비어 있지 않은 동안 다음을 반복합니다.
    - WorkSet을 `recursive_query`의 입력으로 사용하고, `recursive_query`를 실행하여 `newRows`를 얻습니다.
    - `UNION ALL`을 사용하는 경우: `newRows`를 Output에 바로 추가하고, `newRows`를 다음 반복의 WorkSet으로 사용합니다.
    - `UNION`을 사용하는 경우(중복 제거): `newRows`와 기존 Output의 차집합을 구하고(중복 제거), 기존에 없던 행만 Output과 다음 반복의 WorkSet에 추가합니다.
3. `newRows`가 비어 있거나 시스템에 정의된 재귀 깊이 한도에 도달할 때까지 2단계를 반복합니다.

세션 변수 `cte_max_recursion_depth`는 최대 재귀 깊이를 제어합니다. 기본값은 100이며, 이 값을 초과하면 오류가 발생합니다.

### UNION과 UNION ALL 비교 {#union-vs-union-all}

<!-- Knowledge type: Selection comparison -->

| 형식 | 동작 | 성능 | 활용 시나리오 |
|---|---|---|---|
| `UNION ALL` | 중복 행 유지 | 오버헤드가 낮음(중복 제거 없음) | 중복을 허용하거나 애플리케이션 계층에서 중복을 처리하는 경우 |
| `UNION` | 암시적 중복 제거 | 각 반복 또는 전체 결과에 정렬이나 해시를 통한 중복 제거 오버헤드가 추가되며, 데이터가 많으면 비용이 크게 증가함 | 데이터베이스 내부에서 중복을 제거해야 하는 경우 |

권장 사항: 쿼리의 의미상 허용되고 애플리케이션 계층에서 중복을 처리할 수 있다면 `UNION ALL`을 우선 사용하세요.

### 예제 {#examples}

#### 간단한 계층 구조 탐색 {#simple-hierarchy-traversal}

루트 노드에서 시작하여 전체 트리를 재귀적으로 탐색합니다.

```sql
CREATE TABLE tree
(
    id int,
    parent_id int,
    data varchar(100)
) DUPLICATE KEY (id)
DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES ('replication_num' = '1');

INSERT INTO tree VALUES (0, NULL, 'ROOT'), (1, 0, 'Child_1'), (2, 0, 'Child_2'), (3, 1, 'Child_1_1');

WITH RECURSIVE search_tree AS (
    SELECT id, parent_id, data
    FROM tree t
    WHERE t.id = 0
UNION ALL
    SELECT t.id, t.parent_id, t.data
    FROM tree t, search_tree st
    WHERE t.parent_id = st.id
)
SELECT * FROM search_tree ORDER BY id;
```

#### 그래프 탐색 {#graph-traversal}

간선의 방향을 따라 그래프에서 도달 가능한 모든 경로를 탐색합니다.

```sql
CREATE TABLE graph
(
    c_from int,
    c_to int,
    label varchar(100)
) DUPLICATE KEY (c_from) DISTRIBUTED BY HASH(c_from) BUCKETS 1 PROPERTIES ('replication_num' = '1');

INSERT INTO graph VALUES (1, 2, '1 -> 2'), (1, 3, '1 -> 3'), (2, 3, '2 -> 3'), (1, 4, '1 -> 4'), (4, 5, '4 -> 5');

WITH RECURSIVE search_graph AS (
    SELECT c_from, c_to, label FROM graph g
UNION ALL
    SELECT g.c_from, g.c_to, g.label
    FROM graph g, search_graph sg
    WHERE g.c_from = sg.c_to
)
SELECT DISTINCT * FROM search_graph ORDER BY c_from, c_to;
```

참고: 위 예제는 마지막에 `SELECT DISTINCT`를 사용하여 중복을 제거합니다. 재귀 내부에서 `UNION`으로 중복을 제거하면 매 반복마다 중복 제거가 수행되므로 비용이 더 많이 듭니다.

## 재귀 CTE의 제한 사항 {#recursive-cte-limitations}

<!-- Knowledge type: Restrictions and constraints -->

재귀 CTE를 사용할 때는 다음 제약 조건이 적용됩니다.

- CTE 내부의 최상위 연산자는 `UNION` 또는 `UNION ALL`이어야 합니다.
- 비재귀 하위 쿼리는 재귀 CTE 자체를 참조할 수 없습니다.
- 재귀 하위 쿼리는 재귀 CTE를 한 번만 참조할 수 있습니다.
- 재귀 하위 쿼리 안에 또 다른 하위 쿼리가 있으면, 그 내부 하위 쿼리는 재귀 CTE를 참조할 수 없습니다.
- 재귀 CTE의 출력 열 타입은 비재귀 부분에 의해 결정됩니다. 재귀 부분과 비재귀 부분의 타입이 일치하지 않으면 오류가 발생하므로, 명시적 `CAST`를 추가하여 양쪽의 데이터 타입을 맞춰야 합니다.
- 세션 변수 `cte_max_recursion_depth`는 무한 루프를 방지하기 위해 최대 재귀 횟수를 제한합니다. 기본값은 100입니다.

## 자주 발생하는 오류와 해결 방법 {#common-errors-and-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Debugging when writing recursive CTEs -->

| 증상 | 가능한 원인 | 해결 방법 |
|---|---|---|
| 앵커 멤버와 재귀 멤버의 열 개수 또는 타입이 일치하지 않음 | 두 `SELECT` 목록의 열 개수 또는 열 타입이 다름 | 양쪽의 열 개수, 순서, 타입이 같은지 확인합니다. 필요한 경우 `CAST` 또는 명시적 열 이름을 사용합니다. |
| 앵커가 자기 자신을 참조함(허용되지 않음) | 앵커는 CTE 자체를 참조할 수 없음 | 재귀 멤버에서만 CTE를 참조합니다. 구문이나 파스 트리를 확인합니다. |
| 무한 재귀 / 최대 재귀 깊이 초과 | 재귀에 종료 조건이 없거나 종료 조건이 잘못됨 | `WHERE` 필터를 추가하거나 시스템 전체의 최대 재귀 깊이를 조정합니다. 로직 자체가 무한 재귀를 일으킨다면 쿼리 로직을 수정합니다. |

## 참고 자료 {#references}

- [MySQL 재귀 CTE 매뉴얼](https://dev.mysql.com/doc/refman/8.4/en/with.html#common-table-expressions-recursive): 재귀 CTE의 표준 정의와 예제입니다.
