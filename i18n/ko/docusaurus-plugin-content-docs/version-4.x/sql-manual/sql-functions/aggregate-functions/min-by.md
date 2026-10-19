---
{
    "title": "MIN_BY",
    "language": "ko",
    "description": "MINBY 함수는 지정한 열의 최솟값에 대응하는 값을 반환합니다."
}
---

## 설명 {#description}

MIN_BY 함수는 지정한 열의 최솟값에 대응하는 값을 반환합니다.

`<expr2>`가 Array인 경우 배열을 요소별로 사전순으로 비교하며, NULL 요소는 NULL이 아닌 모든 요소보다 큰 것으로 간주합니다. NULL 배열 값은 무시합니다.

버전별 차이: Doris 4.1 계열의 4.1.5 이상 버전과 Doris 4.2 이상에서는 배열 내부의 `NULL` 요소를 `NULL`이 아닌 요소보다 큰 것으로 간주합니다. Doris 4.0과 Doris 4.1의 4.1.5 이전 버전에서는 `NULL` 배열 요소를 더 작은 것으로 간주합니다. 이 모든 버전에서 `NULL` 배열 값은 무시합니다.

## 구문 {#syntax}

```sql
MIN_BY(<expr1>, <expr2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<expr1>` | 대응하는 값에 대한 표현식입니다. 지원 타입: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, Array, Map, Struct. |
| `<expr2>` | 최솟값에 대한 표현식입니다. 지원 타입: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, Array. |

## 반환 값 {#return-value}

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

다음 배열 비교 예제는 Doris 4.1 계열의 4.1.5 이상 버전과 Doris 4.2 이상에 적용됩니다.

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
