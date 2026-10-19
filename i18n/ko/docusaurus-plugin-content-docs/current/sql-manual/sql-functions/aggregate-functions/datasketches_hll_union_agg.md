---
{
"title": "DATASKETCHES_HLL_UNION_AGG",
"language": "ko",
"description": "datasketches_hll_union_agg 함수는 여러 Apache DataSketches HLL 스케치의 합집합을 구하고 합집합의 추정 카디널리티를 DOUBLE 값으로 반환하는 집계 함수입니다."
}
---

## 설명 {#description}

`datasketches_hll_union_agg`는 여러 Apache DataSketches **HLL** (`hll_sketch`) 직렬화 값에 **합집합 연산**을 수행하고, 합집합의 **추정 카디널리티**(근사 고유 값 개수 / NDV)를 반환하는 집계 함수입니다.

이 함수는 **DataSketches HLL 스케치의 직렬화된 바이트**를 입력으로 받습니다(예: DataSketches 라이브러리에서 `hll_sketch.serialize_compact()`로 생성한 값). 임의의 문자열은 허용하지 않습니다.

별칭:

- `ds_hll_estimate`
- `datasketches_hll_estimate`

## 구문 {#syntax}

```sql
datasketches_hll_union_agg(<sketch>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<sketch>` | Apache DataSketches HLL 스케치의 직렬화된 바이트입니다. 지원되는 타입: STRING / VARCHAR / VARBINARY. NULL 값은 무시됩니다. 빈 문자열은 유효하지 않은 입력으로 처리되어 오류가 발생합니다. |

## 반환 값 {#return-value}

DOUBLE (Float64) 타입의 카디널리티 추정값을 반환합니다.  
그룹에 유효한 데이터가 없거나 입력이 비어 있으면 0을 반환합니다.  
입력 바이트를 유효한 DataSketches HLL 스케치로 역직렬화할 수 없으면(빈 문자열 포함) 오류가 발생합니다(일반적으로 오류 코드는 `CORRUPTION`).

## 예제 {#example}

```sql
-- setup
CREATE TABLE test_datasketches_hll_union_agg_tbl (
    id INT,
    sk STRING
)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

-- The sketch bytes are inserted via Base64 decoding.
INSERT INTO test_datasketches_hll_union_agg_tbl VALUES
    (1, from_base64('AgEHCAMIBwjL18IEK/L7BoYv+Q11gWYHgbxdBntl5gj8LUIK')),
    (2, from_base64('AwEHCAUIAAkKAAAAIjvrBcS1nwfGGWoEyHokBO8t9wc1qTEENkcJB7hWqQxZf9QNnuSbGA==')),
    (3, NULL);
```

```sql
-- The function returns DOUBLE, so use ROUND/CAST if you want an integer display.
SELECT CAST(ROUND(datasketches_hll_union_agg(sk)) AS BIGINT)
FROM test_datasketches_hll_union_agg_tbl;
```

```text
+-------------------------------------------------------+
| CAST(ROUND(datasketches_hll_union_agg(sk)) AS BIGINT) |
+-------------------------------------------------------+
|                                                    17 |
+-------------------------------------------------------+
```

```sql
-- aliases
SELECT
    CAST(ROUND(datasketches_hll_union_agg(sk)) AS BIGINT) AS v1,
    CAST(ROUND(ds_hll_estimate(sk)) AS BIGINT)            AS v2,
    CAST(ROUND(datasketches_hll_estimate(sk)) AS BIGINT)  AS v3
FROM test_datasketches_hll_union_agg_tbl;
```

```text
+------+------+------+
| v1   | v2   | v3   |
+------+------+------+
|   17 |   17 |   17 |
+------+------+------+
```

```sql
-- empty input returns 0
SELECT datasketches_hll_union_agg(sk)
FROM test_datasketches_hll_union_agg_tbl
WHERE sk IS NULL;
```

```text
+--------------------------------+
| datasketches_hll_union_agg(sk) |
+--------------------------------+
|                              0 |
+--------------------------------+
```

```sql
-- invalid sketch bytes will throw
SELECT datasketches_hll_union_agg(from_base64('AA=='));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CORRUPTION]HLL sketch data corrupted when add: Attempt to deserialize unknown object type
```

```sql
-- empty string is invalid and will throw
SELECT datasketches_hll_union_agg('');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CORRUPTION]HLL sketch data corrupted when add: empty input.
```
