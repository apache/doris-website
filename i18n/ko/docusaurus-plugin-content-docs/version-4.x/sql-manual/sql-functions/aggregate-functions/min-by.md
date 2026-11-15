---
{
    "title": "MIN_BY",
    "language": "ko",
    "description": "MINBY 함수는 지정한 열의 최솟값을 기준으로 연관된 값을 반환합니다."
}
---

## 설명 {#description}

MIN_BY 함수는 지정한 열의 최솟값을 기준으로 연관된 값을 반환합니다.

`<expr2>`가 Array인 경우 배열을 원소별로 사전식 순서에 따라 비교합니다. NULL 원소는 NULL이 아닌 모든 원소보다 큽니다. 배열 값 자체가 NULL이면 무시합니다.

버전별 차이: Doris 4.1 계열의 4.1.5 이상 버전과 Doris 4.2 이상 버전에서는 배열 안의 `NULL` 원소가 NULL이 아닌 원소보다 큽니다. Doris 4.0과 4.1.5 이전의 Doris 4.1 버전에서는 배열 안의 `NULL` 원소가 NULL이 아닌 원소보다 작습니다. 이 모든 버전에서 배열 값 자체가 NULL이면 무시합니다.

여러 행의 `<expr2>`가 동일한 최솟값을 가지면 `MIN_BY`는 그중 한 행의 `<expr1>`을 반환합니다. 어느 행이 선택될지는 보장되지 않으며, 반환값이 연관된 값 중 최솟값이라는 보장도 없습니다. 결과를 확정하려면 동률 처리 규칙을 지정하세요. 예를 들어 `<expr2>`가 최솟값인 행만 선택한 다음 `<expr1>`에 `MIN`을 적용할 수 있습니다.

## 구문 {#syntax}

```sql
MIN_BY(<expr1>, <expr2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<expr1>` | 연관된 값을 나타내는 표현식입니다. 지원하는 타입: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, Array, Map, Struct. |
| `<expr2>` | 최솟값을 구할 표현식입니다. 지원하는 타입: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, Array. |

## 반환값 {#return-value}

<expr1>과 동일한 데이터 타입을 반환합니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#example}

```sql
-- setup
create table tbl(
    k1 int,
    k2 int,
    arr ARRAY<INT>,
    mp MAP<STRING, INT>,
    st STRUCT<a: INT, b: STRING>,
) distributed by hash(k1) buckets 1
properties ("replication_num"="1");
insert into tbl values
    (0, 100, [1,2,3], {"x": 1, "y": 4}, NAMED_STRUCT("a", 1, "b", "x")),
    (1, 4,   [5, 6],  {"x": 2, "y": 3}, NAMED_STRUCT("a", 2, "b", "y")),
    (4, 1,   [7],     {"x": 3, "y": 2}, NAMED_STRUCT("a", 3, "b", "z")),
    (3, 1,   [8],     {"x": 4, "y": 1}, NAMED_STRUCT("a", 4, "b", "r"));
```

```text
Table created and data inserted successfully.
```

```sql
select min_by(k1, k2) from tbl;
```

다음은 가능한 결과 중 하나입니다. 이 예제에서는 `3`과 `4` 중 어느 값이 반환되어도 유효합니다.

```text
+----------------+
| min_by(k1, k2) |
+----------------+
|              3 |
+----------------+
```

```sql
select min_by(arr, k1), min_by(mp, k1), min_by(st, k1) from tbl;
```

```text
+-----------------+----------------+------------------+
| min_by(arr, k1) | min_by(mp, k1) | min_by(st, k1)   |
+-----------------+----------------+------------------+
| [1, 2, 3]       | {"x":1, "y":4} | {"a":1, "b":"x"} |
+-----------------+----------------+------------------+
```

```sql
select min_by(k1, arr), min_by(mp, arr), min_by(st, arr), min_by(arr, arr) from tbl;
```

```text
+-----------------+-----------------+------------------+------------------+
| min_by(k1, arr) | min_by(mp, arr) | min_by(st, arr)  | min_by(arr, arr) |
+-----------------+-----------------+------------------+------------------+
|               0 | {"x":1, "y":4}  | {"a":1, "b":"x"} | [1, 2, 3]        |
+-----------------+-----------------+------------------+------------------+
```

```sql
select min_by(k1, k2) from tbl where k1 is null;
```

```text
+----------------+
| min_by(k1, k2) |
+----------------+
|           NULL |
+----------------+
```

다음 배열 비교 예제는 Doris 4.1 계열의 4.1.5 이상 버전과 Doris 4.2 이상 버전에 적용됩니다.

```sql
SELECT min_by(label, sort_key) AS result
FROM (
    SELECT 'null element' AS label, [1, NULL] AS sort_key
    UNION ALL SELECT 'non-null element', [1, 2]
    UNION ALL SELECT 'null array', CAST(NULL AS ARRAY<INT>)
) t;
```

```text
non-null element
```

```sql
SELECT min_by(1, CAST(NULL AS ARRAY<INT>)) AS result;
```

```text
NULL
```

### 동일한 최솟값을 갖는 행의 결과를 확정적으로 처리하기 {#deterministic-handling-of-tied-minimum-values}

다음은 독립적으로 실행할 수 있는 예제로, `k4`가 최솟값인 행 중 가장 작은 `k1`을 반환합니다. 두 행의 `k4 = 1`이 최솟값이더라도 결과는 항상 `3`입니다.

```sql
WITH data AS (
    SELECT 0 AS k1, 100 AS k4
    UNION ALL SELECT 1, 4
    UNION ALL SELECT 4, 1
    UNION ALL SELECT 3, 1
)
SELECT MIN(k1) AS min_k1
FROM data
WHERE k4 = (SELECT MIN(k4) FROM data);
```

```text
+--------+
| min_k1 |
+--------+
|      3 |
+--------+
```
