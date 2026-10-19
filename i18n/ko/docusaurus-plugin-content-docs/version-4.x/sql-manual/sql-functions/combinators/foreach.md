---
{
    "title": "FOREACH",
    "language": "ko",
    "description": "테이블용 집계 함수를 대응하는 배열 요소를 집계하고 배열을 반환하는 배열용 집계 함수로 변환합니다."
}
---

## 설명 {#description}

테이블용 집계 함수를 대응하는 배열 요소를 집계하여 결과 배열을 반환하는 배열용 집계 함수로 변환합니다. 예를 들어 배열 [1, 2], [3, 4, 5], [6, 7]에 sum_foreach를 적용하면 대응하는 배열 요소를 더한 결과로 [10, 13, 5]가 반환됩니다.

## 구문 {#syntax}

`AGGREGATE_FUNCTION_FOREACH(arg...)`

## 예제 {#example}

예제 데이터를 준비합니다:

```sql
CREATE TABLE db (
    id INT,
    a  ARRAY<INT>,
    s  ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO db VALUES
    (1, [1, 2, 3], ["ab", "123"]),
    (2, [20],      ["cd"]),
    (3, [100],     ["efg"]),
    (4, NULL,      NULL),
    (5, [null, 2], [null, "c"]);
```

그런 다음 FOREACH 조합자를 실행합니다:

```
mysql [test]>select a , s from db;
+-----------+---------------+
| a         | s             |
+-----------+---------------+
| [1, 2, 3] | ["ab", "123"] |
| [20]      | ["cd"]        |
| [100]     | ["efg"]       |
| NULL      | NULL          |
| [null, 2] | [null, "c"]   |
+-----------+---------------+

mysql [test]>select sum_foreach(a) from db;
+----------------+
| sum_foreach(a) |
+----------------+
| [121, 4, 3]    |
+----------------+

mysql [test]>select count_foreach(s) from db;
+------------------+
| count_foreach(s) |
+------------------+
| [3, 2]           |
+------------------+

mysql [test]>select array_agg_foreach(a) from db;
+-----------------------------------+
| array_agg_foreach(a)              |
+-----------------------------------+
| [[1, 20, 100, null], [2, 2], [3]] |
+-----------------------------------+

mysql [test]>select map_agg_foreach(a,a) from db;
+---------------------------------------+
| map_agg_foreach(a, a)                 |
+---------------------------------------+
| [{1:1, 20:20, 100:100}, {2:2}, {3:3}] |
+---------------------------------------+
```
## 참고 사항 {#notes}

- 각 인수는 요소 타입이 내부 집계 함수의 대응하는 인수 타입과 일치하는 ARRAY여야 합니다. 결과는 내부 함수의 반환 타입을 요소 타입으로 하는 ARRAY이며, 각 위치별로 계산됩니다.
- 한 번의 호출에 여러 배열 인수를 전달할 때는 같은 행에 있는 모든 배열의 길이가 같아야 합니다. 그렇지 않으면 `Arrays passed to <function> aggregate function have different sizes` 오류와 함께 쿼리가 실패합니다. (행 간에는 배열 길이가 달라도 됩니다.)
- `percentile`, `percentile_array`, `percentile_approx`, `percentile_approx_weighted` 함수는 `foreach` 조합자와 함께 사용할 수 없습니다.

### 키워드 {#keywords}
FOREACH
