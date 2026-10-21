---
{
    "title": "MAX_MAP",
    "language": "ko",
    "description": "MAX_MAP 함수는 MAP 값을 키별로 집계하고 각 키의 최댓값을 반환합니다."
}
---

## 설명 {#description}

MAX_MAP 함수는 MAP 값을 키별로 집계하고 각 키의 NULL이 아닌 최댓값을 담은 MAP을 반환합니다.

## 사용 시 참고 사항 {#usage-notes}

반환되는 MAP의 항목 순서는 보장되지 않습니다. 일정한 출력 순서가 필요한 경우 `map_keys`, `map_values`, `array_sort`, `array_sortby`를 사용하세요. NULL 키는 일반 키와 동일하게 집계되며, 모든 NULL 키는 결과에서 하나의 항목으로 합쳐집니다.

## 구문 {#syntax}

```sql
MAX_MAP(<map_expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<map_expr>` | MAP 표현식입니다. MAP 값의 타입은 MAX 집계 함수로 비교할 수 있어야 합니다. |

## 반환값 {#return-value}

키 타입이 `<map_expr>`와 같은 MAP을 반환합니다. 값 타입이 DecimalV2이면 반환되는 값 타입은 이에 대응하는 DecimalV3 타입입니다. 그 외에는 반환되는 값 타입이 입력 MAP의 값 타입과 같습니다.

그룹에 유효한 입력 행이 없으면 빈 MAP을 반환합니다. 특정 키가 존재하지만 해당 키의 값이 모두 NULL이면 해당 키의 값은 NULL입니다.

## 예제 {#example}

```sql
-- setup
CREATE TABLE map_agg_example (
    id INT,
    m MAP<INT, INT>,
    ms MAP<INT, STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO map_agg_example VALUES
    (1, MAP(1, 10, 2, 20), MAP(1, 'b', 2, 'x')),
    (1, MAP(2, 5, 3, 30), MAP(1, 'a', 3, NULL)),
    (2, MAP(1, 7, 4, NULL), MAP(2, 'z')),
    (2, CAST(MAP() AS MAP<INT, INT>), CAST(MAP() AS MAP<INT, STRING>));
```

```text
Query OK
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, MAX_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+--------------+
| id   | keys      | values       |
+------+-----------+--------------+
|    1 | [1, 2, 3] | [10, 20, 30] |
|    2 | [1, 4]    | [7, null]    |
+------+-----------+--------------+
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, MAX_MAP(ms) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+----------------+
| id   | keys      | values         |
+------+-----------+----------------+
|    1 | [1, 2, 3] | ["b", "x", null] |
|    2 | [2]       | ["z"]          |
+------+-----------+----------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT MAX_MAP(m) AS result
    FROM map_agg_example
    WHERE id = 100
) t;
```

```text
+------+--------+
| keys | values |
+------+--------+
| []   | []     |
+------+--------+
```
