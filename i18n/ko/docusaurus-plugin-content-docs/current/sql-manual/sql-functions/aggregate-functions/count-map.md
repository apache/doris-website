---
{
    "title": "COUNT_MAP",
    "language": "ko",
    "description": "COUNT_MAP 함수는 MAP 값을 키별로 집계하고 각 키에서 NULL이 아닌 값의 개수를 반환합니다."
}
---

## 설명 {#description}

COUNT_MAP 함수는 MAP 값을 키별로 집계하고 각 키에서 NULL이 아닌 값의 개수를 담은 MAP을 반환합니다.

## 사용 시 유의 사항 {#usage-notes}

반환된 MAP의 항목 순서는 보장되지 않습니다. 일정한 출력 순서가 필요하면 `map_keys`, `map_values`, `array_sort`, `array_sortby`를 사용하세요. NULL 키도 일반 키와 동일하게 집계되며, 모든 NULL 키는 하나의 결과 항목에 속합니다.

## 구문 {#syntax}

```sql
COUNT_MAP(<map_expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<map_expr>` | MAP 표현식. |

## 반환 값 {#return-value}

`<map_expr>`와 키 타입이 같고 값 타입이 BIGINT인 MAP을 반환합니다.

그룹에 유효한 입력 행이 없으면 빈 MAP을 반환합니다. 키가 존재하지만 해당 키의 값이 모두 NULL이면 해당 키의 값은 0입니다.

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
    SELECT id, COUNT_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+-----------+
| id   | keys      | values    |
+------+-----------+-----------+
|    1 | [1, 2, 3] | [1, 2, 1] |
|    2 | [1, 4]    | [1, 0]    |
+------+-----------+-----------+
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, COUNT_MAP(ms) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+-----------+
| id   | keys      | values    |
+------+-----------+-----------+
|    1 | [1, 2, 3] | [2, 1, 0] |
|    2 | [2]       | [1]       |
+------+-----------+-----------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT COUNT_MAP(m) AS result
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
