---
{
    "title": "SUM_MAP",
    "language": "ko",
    "description": "SUM_MAP 함수는 MAP 값을 키별로 집계하여 각 키의 값 합계를 반환합니다."
}
---

## 설명 {#description}

SUM_MAP 함수는 MAP 값을 키별로 집계하여 각 키의 NULL이 아닌 값의 합계를 담은 MAP을 반환합니다.

## 사용 시 유의 사항 {#usage-notes}

반환되는 MAP의 항목 순서는 보장되지 않습니다. 일관된 출력 순서가 필요하면 `map_keys`, `map_values`, `array_sort`, `array_sortby`를 사용하세요. NULL 키는 일반 키와 동일하게 집계되며, 모든 NULL 키는 같은 결과 항목에 속합니다.

## 구문 {#syntax}

```sql
SUM_MAP(<map_expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<map_expr>` | MAP 표현식입니다. MAP의 값 타입은 숫자 타입이어야 합니다. |

## 반환값 {#return-value}

`<map_expr>`와 키 타입이 같은 MAP을 반환합니다. 정수 계열, Boolean, NULL 값 타입의 경우 반환되는 값 타입은 BIGINT입니다. Float 및 Double 값 타입의 경우 반환되는 값 타입은 DOUBLE입니다. Decimal 값 타입의 경우 반환되는 값 타입은 지원되는 최대 정밀도와 입력과 동일한 스케일을 갖는 Decimal 타입입니다. LargeInt 값 타입의 경우 반환되는 값 타입은 LargeInt입니다.

그룹에 유효한 입력 행이 없으면 빈 MAP을 반환합니다. 키가 존재하지만 해당 키의 모든 값이 NULL이면 해당 키의 값은 NULL입니다.

## 예제 {#example}

```sql
-- setup
CREATE TABLE map_agg_example (
    id INT,
    m MAP<INT, INT>,
    md MAP<STRING, DECIMAL(10, 2)>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO map_agg_example VALUES
    (1, MAP(1, 10, 2, 20), MAP('a', 1.20, 'b', 2.30)),
    (1, MAP(2, 5, 3, 30), MAP('b', 3.70, 'c', 4.00)),
    (2, MAP(1, 7, 4, NULL), MAP('a', NULL, 'c', 5.50)),
    (2, CAST(MAP() AS MAP<INT, INT>), CAST(MAP() AS MAP<STRING, DECIMAL(10, 2)>));
```

```text
Query OK
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, SUM_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+--------------+
| id   | keys      | values       |
+------+-----------+--------------+
|    1 | [1, 2, 3] | [10, 25, 30] |
|    2 | [1, 4]    | [7, null]    |
+------+-----------+--------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT SUM_MAP(md) AS result
    FROM map_agg_example
) t;
```

```text
+-----------------+--------------------+
| keys            | values             |
+-----------------+--------------------+
| ["a", "b", "c"] | [1.20, 6.00, 9.50] |
+-----------------+--------------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT SUM_MAP(m) AS result
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
